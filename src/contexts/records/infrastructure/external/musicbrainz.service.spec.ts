import { MbidCacheRepository } from '@/contexts/records/domain/repositories/mbid-cache.repository';
import { MBID } from '@/contexts/records/domain/value-objects/mbid.vo';
import { MusicBrainzService } from './musicbrainz.service';

describe('MusicBrainzService', () => {
  const cacheRepo: MbidCacheRepository = {
    findTracklist: jest.fn().mockResolvedValue(null),
    upsertTracklist: jest.fn().mockResolvedValue(undefined),
  };
  const service = new MusicBrainzService(cacheRepo);

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('fetchTracklistByMbid returns titles on successful fetch', async () => {
    const xml = `
      <metadata>
        <release>
          <medium-list>
            <medium>
              <track-list>
                <track><recording><title>Song A</title></recording></track>
                <track><title>Song B</title></track>
              </track-list>
            </medium>
          </medium-list>
        </release>
      </metadata>`;

    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: () => xml });

    const titles = await service.fetchTracklistByMbid(
      MBID.from('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d'),
    );
    expect(titles).toEqual(['Song A', 'Song B']);
  });

  it('fetchTracklistByMbid returns [] on HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const titles = await service.fetchTracklistByMbid(
      MBID.from('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d'),
    );
    expect(Array.isArray(titles)).toBe(true);
    expect(titles.length).toBe(0);
  });

  it('builds release URL with defaults', () => {
    const anyService: any = service;
    const url: URL = anyService.buildReleaseUrl(
      'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
    );
    expect(url.toString()).toContain('release/');
    expect(url.searchParams.get('inc')).toBe('recordings');
    expect(url.searchParams.get('fmt')).toBe('xml');
  });
});
