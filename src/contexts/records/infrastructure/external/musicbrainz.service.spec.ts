import { MbidCacheRepository } from '@/contexts/records/domain/repositories/mbid-cache.repository';
import { MBID } from '@/contexts/records/domain/value-objects/mbid.vo';
import { MusicBrainzService } from './musicbrainz.service';

describe('MusicBrainzService', () => {
  const cacheRepo: MbidCacheRepository = {
    findTracklist: jest.fn().mockResolvedValue(null),
    upsertTracklist: jest.fn().mockResolvedValue(undefined),
    findReleaseMbid: jest.fn().mockResolvedValue(null),
    upsertReleaseMbid: jest.fn().mockResolvedValue(undefined),
  };
  const service = new MusicBrainzService(cacheRepo);

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('fetchTracklistByMbid returns titles on successful fetch', async () => {
    const xml = `
      <metadata>
        <release>
          <date>0000-00-00</date>
          <medium-list>
            <medium>
              <track-list>
                <track><recording><title>Song A</title></recording><length>0</length><<video>false</video></track>
                <track><recording><title>Song B</title></recording><length>0</length><<video>false</video></track>
              </track-list>
            </medium>
          </medium-list>
        </release>
      </metadata>`;

    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: () => xml });

    const titles = await service.fetchTrackInfosByMbid(
      MBID.from('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d'),
    );
    expect(titles).toEqual([
      {
        title: 'Song A',
        length: '0:00',
        releaseDate: '0000-00-00',
      },
      {
        title: 'Song B',
        length: '0:00',
        releaseDate: '0000-00-00',
      },
    ]);
  });

  it('fetchTracklistByMbid returns [] on HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const titles = await service.fetchTrackInfosByMbid(
      MBID.from('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d'),
    );
    expect(Array.isArray(titles)).toBe(true);
    expect(titles.length).toBe(0);
  });

  it('fetchTracklistByMbid uses cache when available', async () => {
    (cacheRepo.findTracklist as jest.Mock).mockResolvedValue([
      {
        title: 'Cached',
        length: '1:00',
        releaseDate: '2020-01-01',
        hasVideo: false,
      },
    ]);
    global.fetch = jest.fn();
    const res = await service.fetchTrackInfosByMbid(
      MBID.from('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d'),
    );
    expect(res).toEqual([
      {
        title: 'Cached',
        length: '1:00',
        releaseDate: '2020-01-01',
        hasVideo: false,
      },
    ]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetchTracklistByMbid caches parsed tracklist with release id', async () => {
    (cacheRepo.findTracklist as jest.Mock).mockResolvedValue(null);
    const xml = `
      <metadata>
        <release id="rel-1">
          <date>1969-09-26</date>
          <medium-list>
            <medium>
              <track-list>
                <track><recording><title>Song A</title></recording><length>65000</length></track>
              </track-list>
            </medium>
          </medium-list>
        </release>
      </metadata>`;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: () => xml });
    await service.fetchTrackInfosByMbid(
      MBID.from('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d'),
    );
    expect(cacheRepo.upsertTracklist).toHaveBeenCalledWith(
      'rel-1',
      [{ title: 'Song A', length: '1:05', releaseDate: '1969-09-26' }],
      7,
    );
  });

  it('searchReleaseMbid returns MBID on successful XML parse', async () => {
    const xml = `
      <metadata>
        <release-list>
          <release id="b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d"></release>
        </release-list>
      </metadata>`;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: () => xml });
    const res = await service.searchReleaseMbid('The Beatles', 'Abbey Road');
    expect(res?.toString()).toBe('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d');
  });

  it('searchReleaseMbid returns null on invalid input', async () => {
    const res = await service.searchReleaseMbid('', '');
    expect(res).toBeNull();
  });

  it('searchReleaseMbid returns null on HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const res = await service.searchReleaseMbid('A', 'B');
    expect(res).toBeNull();
  });
});
