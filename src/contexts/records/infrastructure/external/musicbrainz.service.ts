import { MusicMetadataService } from '@/contexts/records/application/services/music-metadata.service';
import {
  MBID_CACHE_REPOSITORY,
  MbidCacheRepository,
} from '@/contexts/records/domain/repositories/mbid-cache.repository';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { Tracklist } from '../../domain/types/tracklist.type';
import { MBID } from '../../domain/value-objects/mbid.vo';

@Injectable()
export class MusicBrainzService implements MusicMetadataService {
  private readonly BASE_URL = 'https://musicbrainz.org/ws/2/';
  private readonly USER_AGENT = 'BrokenRecordStore';
  private readonly DEFAULT_INC = 'recordings';
  private readonly DEFAULT_FMT = 'xml';

  private readonly logger = new Logger(MusicBrainzService.name);

  constructor(
    @Inject(MBID_CACHE_REPOSITORY)
    private readonly cacheRepo: MbidCacheRepository,
  ) {}

  async fetchTrackInfosByMbid(mbid: MBID): Promise<Tracklist[]> {
    const url = this.buildReleaseUrl(mbid.toString());
    try {
      const xml = await this.fetchXml(url);
      return this.parseXmlAndExtractTrackInfos(xml);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `MusicBrainz fetch (details) failed for mbid=${mbid}: ${message}`,
      );
      return [];
    }
  }

  async searchReleaseMbid(artist: string, album: string): Promise<MBID | null> {
    const qArtist = artist.trim();
    const qAlbum = album.trim();
    if (!qArtist || !qAlbum) return null;
    const params = new URLSearchParams({
      query: `artist:"${qArtist}" AND release:"${qAlbum}"`,
      fmt: this.DEFAULT_FMT,
    });

    const url = new URL(`release/?${params.toString()}`, this.BASE_URL);

    try {
      const xml = await this.fetchXml(url);
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
      });

      const obj = parser.parse(xml);
      const list = obj?.metadata?.['release-list'];
      const releasesRaw = list?.release ?? [];
      const releases = Array.isArray(releasesRaw)
        ? releasesRaw
        : releasesRaw
          ? [releasesRaw]
          : [];
      const best: any = releases[0];
      const id = (best?.id || '').trim();
      if (!id || !MBID.isValid(id)) return null;
      return MBID.from(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `MusicBrainz search (XML) failed for artist="${qArtist}" album="${qAlbum}": ${message}`,
      );
      return null;
    }
  }

  private buildReleaseUrl(mbid: string): URL {
    const encoded = encodeURIComponent(mbid);

    const urlParams = new URLSearchParams({
      inc: this.DEFAULT_INC,
      fmt: this.DEFAULT_FMT,
    });

    return new URL(`release/${encoded}?${urlParams.toString()}`, this.BASE_URL);
  }

  private async fetchXml(url: URL): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent': this.USER_AGENT,
        Accept: 'application/xml',
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.text();
  }

  private parseXmlAndExtractTrackInfos(xml: string): {
    title: string;
    length: string;
    releaseDate: string;
    hasVideo: boolean;
  }[] {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    const obj = parser.parse(xml);
    return this.extractTrackInfosFromXml(obj);
  }

  private extractTrackInfosFromXml(obj: any): Tracklist[] {
    const out: {
      title: string;
      length: string;
      releaseDate: string;
      hasVideo: boolean;
    }[] = [];
    const release =
      obj?.metadata?.release ?? obj?.metadata?.['release-list']?.release;
    if (!release) return out;

    const releaseDate = String(release?.date || '').trim();

    const mediumsRaw = release?.['medium-list']?.medium ?? [];
    const mediums = Array.isArray(mediumsRaw)
      ? mediumsRaw
      : mediumsRaw
        ? [mediumsRaw]
        : [];
    for (const medium of mediums) {
      const tracksRaw = medium?.['track-list']?.track ?? [];
      const tracks = Array.isArray(tracksRaw)
        ? tracksRaw
        : tracksRaw
          ? [tracksRaw]
          : [];
      for (const tr of tracks) {
        const title = (tr?.recording?.title ?? tr?.title ?? '').trim();
        const ms = Number(tr?.recording?.length ?? tr?.length ?? 0) || 0;
        const hasVideo = Boolean(
          (tr?.recording?.video ?? tr?.video ?? '')
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '') === 'true',
        );
        if (!title) continue;
        out.push({ title, length: this.msToMinSec(ms), releaseDate, hasVideo });
      }
    }
    return out;
  }

  private msToMinSec(ms: number): string {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
