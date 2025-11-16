import { MusicMetadataService } from '@/contexts/records/application/services/music-metadata.service';
import {
  MBID_CACHE_REPOSITORY,
  MbidCacheRepository,
} from '@/contexts/records/domain/repositories/mbid-cache.repository';
import { Inject, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { XMLParser } from 'fast-xml-parser';
import { Tracklist } from '../../domain/types/tracklist.type';
import { MBID } from '../../domain/value-objects/mbid.vo';

@Injectable()
export class MusicBrainzService implements MusicMetadataService {
  private readonly BASE_URL = 'https://musicbrainz.org/ws/2/';
  private readonly USER_AGENT = 'BrokenRecordStore/1.0';
  private readonly DEFAULT_INC = 'recordings';
  private readonly DEFAULT_FMT = 'xml';

  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  constructor(
    @Inject(MBID_CACHE_REPOSITORY)
    private readonly cacheRepo: MbidCacheRepository,
  ) {}

  async fetchTrackInfosByMbid(mbid: MBID): Promise<Tracklist[]> {
    return Sentry.startSpan(
      { name: 'MusicBrainzService#fetchTrackInfosByMbid', op: 'external' },
      async () => {
        // Check cache
        const cached = await this.cacheRepo.findTracklist(mbid.toString());

        if (cached) return cached;

        const encoded = encodeURIComponent(mbid.toString());

        const urlParams = new URLSearchParams({
          inc: this.DEFAULT_INC,
          fmt: this.DEFAULT_FMT,
        });

        const url = new URL(
          `release/${encoded}?${urlParams.toString()}`,
          this.BASE_URL,
        );

        try {
          const xml = await this.fetchXml(url);
          return this.extractTrackInfosFromXml(xml);
        } catch (err) {
          Sentry.captureException(err);
          return [];
        }
      },
    );
  }

  async searchReleaseMbid(artist: string, album: string): Promise<MBID | null> {
    return Sentry.startSpan(
      { name: 'MusicBrainzService#searchReleaseMbid', op: 'external' },
      async () => {
        const qArtist = artist.trim();
        const qAlbum = album.trim();

        if (!qArtist || !qAlbum) return null;

        const params = new URLSearchParams({
          query: `artist:"${qArtist}" AND release:"${qAlbum}"`,
          fmt: this.DEFAULT_FMT,
        });

        const url = new URL(`release?${params.toString()}`, this.BASE_URL);

        try {
          const xml = await this.fetchXml(url);
          const obj = this.parser.parse(xml);

          const list = obj?.metadata?.['release-list'];

          const releaseRaw = list?.release ?? [];

          const releases = Array.isArray(releaseRaw)
            ? releaseRaw
            : [releaseRaw];

          const bestScore = releases[0];

          if (!bestScore) return null;

          const id = (bestScore?.id || '').trim();

          if (!MBID.isValid(id)) return null;

          return MBID.from(id);
        } catch (err) {
          Sentry.captureException(err);
          return null;
        }
      },
    );
  }

  private async fetchXml(url: URL): Promise<string> {
    return Sentry.startSpan(
      { name: 'MusicBrainzService#fetchXml', op: 'external' },
      async () => {
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
      },
    );
  }

  private async extractTrackInfosFromXml(xml: string): Promise<Tracklist[]> {
    const obj = this.parser.parse(xml);

    const out: Tracklist[] = [];

    const release = obj?.metadata?.release;

    if (!release) return out;

    const releaseDate = String(release?.date || '').trim();

    const mediumRaw = release?.['medium-list']?.medium ?? [];

    const mediums = Array.isArray(mediumRaw) ? mediumRaw : [mediumRaw];

    for (const medium of mediums) {
      const tracks = medium?.['track-list']?.track ?? [];

      for (const tr of tracks) {
        const title = String(tr?.recording?.title).trim();
        const ms = Number(tr?.length) || 0;

        if (!title) continue;

        out.push({ title, length: this.msToMinSec(ms), releaseDate });
      }
    }

    // Cache the tracklist for 7 days
    await this.cacheRepo.upsertTracklist(release.id, out, 7);

    return out;
  }

  private msToMinSec(ms: number): string {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
