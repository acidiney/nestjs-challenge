import { MusicMetadataService } from '@/contexts/records/application/services/music-metadata.service';
import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { MBID } from '../../domain/value-objects/mbid.vo';

@Injectable()
export class MusicBrainzService implements MusicMetadataService {
  private readonly BASE_URL = 'https://musicbrainz.org/ws/2/';
  private readonly USER_AGENT = 'BrokenRecordStore';
  private readonly DEFAULT_INC = 'recordings';
  private readonly DEFAULT_FMT = 'xml';

  private readonly logger = new Logger(MusicBrainzService.name);

  async fetchTracklistByMbid(mbid: MBID): Promise<string[]> {
    const url = this.buildReleaseUrl(mbid.toString());
    try {
      const xml = await this.fetchXml(url);
      return this.parseXmlAndExtractTitles(xml);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`MusicBrainz fetch failed for mbid=${mbid}: ${message}`);
      return [];
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

  private parseXmlAndExtractTitles(xml: string): string[] {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    const obj = parser.parse(xml);
    return this.extractTrackTitlesFromXml(obj);
  }

  private extractTrackTitlesFromXml(obj: any): string[] {
    const titles: string[] = [];
    const release =
      obj?.metadata?.release ?? obj?.metadata?.['release-list']?.release;
    if (!release) return titles;

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
        if (title) titles.push(title);
      }
    }
    return titles;
  }
}
