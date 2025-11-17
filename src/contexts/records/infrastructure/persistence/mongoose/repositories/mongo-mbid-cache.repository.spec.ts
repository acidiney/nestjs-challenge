import { MongoMbidCacheRepository } from './mongo-mbid-cache.repository';

describe('MongoMbidCacheRepository', () => {
  const makeFindOneChain = (doc: any) => ({
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(doc),
  });

  const makeUpdateOneChain = () => ({
    exec: jest.fn().mockResolvedValue({ acknowledged: true }),
  });

  const makeModel = (doc: any = null) => {
    const updateChain = makeUpdateOneChain();
    return {
      findOne: jest.fn().mockReturnValue(makeFindOneChain(doc)),
      updateOne: jest.fn().mockReturnValue(updateChain),
      __updateChain: updateChain,
    } as any;
  };

  it('findTracklist returns null when no cached doc found', async () => {
    const model = makeModel(null);
    const repo = new MongoMbidCacheRepository(model as any);

    const res = await repo.findTracklist('m1');
    expect(model.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        mbid: 'm1',
        expiresAt: expect.objectContaining({ $gt: expect.any(Date) }),
      }),
    );
    expect(res).toBeNull();
  });

  it('findTracklist returns cached tracklist when doc is valid', async () => {
    const doc = {
      mbid: 'm1',
      tracklist: [
        {
          title: 'A',
          length: '1:00',
          releaseDate: '2024-01-01',
        },
      ],
      expiresAt: new Date(Date.now() + 100000),
    };
    const model = makeModel(doc);
    const repo = new MongoMbidCacheRepository(model as any);

    const res = await repo.findTracklist('m1');
    expect(Array.isArray(res)).toBe(true);
    expect(res).toHaveLength(1);
    expect(res?.[0]).toMatchObject({ title: 'A' });
  });

  it('findTracklist returns empty array when doc has no tracklist', async () => {
    const doc = { mbid: 'm1', expiresAt: new Date(Date.now() + 100000) } as any;
    const model = makeModel(doc);
    const repo = new MongoMbidCacheRepository(model as any);

    const res = await repo.findTracklist('m1');
    expect(res).toEqual([]);
  });

  it('upsertTracklist writes document with TTL and returns void', async () => {
    const model = makeModel();
    const repo = new MongoMbidCacheRepository(model as any);
    const tracklist = [
      {
        title: 'A',
        length: '1:00',
        releaseDate: '2024-01-01',
      },
    ];

    await repo.upsertTracklist('m1', tracklist as any, 2);

    expect(model.updateOne).toHaveBeenCalled();
    const call = (model.updateOne as jest.Mock).mock.calls[0];
    const filter = call[0];
    const update = call[1];
    const options = call[2];

    expect(filter).toEqual({ mbid: 'm1' });
    expect(update.$set.mbid).toBe('m1');
    expect(update.$set.tracklist).toEqual(tracklist);
    expect(update.$set.fetchedAt).toBeInstanceOf(Date);
    expect(update.$set.expiresAt).toBeInstanceOf(Date);
    expect(options).toMatchObject({ upsert: true });

    const diff =
      update.$set.expiresAt.getTime() - update.$set.fetchedAt.getTime();
    expect(diff).toBe(2 * 24 * 60 * 60 * 1000);
  });

  it('findReleaseMbid returns null when no cached doc found', async () => {
    const model = makeModel(null);
    const repo = new MongoMbidCacheRepository(model as any);

    const res = await repo.findReleaseMbid('Artist', 'Album');
    expect(model.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        artist: 'Artist',
        album: 'Album',
        expiresAt: expect.objectContaining({ $gt: expect.any(Date) }),
      }),
    );
    expect(res).toBeNull();
  });

  it('findReleaseMbid returns cached mbid when doc is valid', async () => {
    const doc = {
      artist: 'Artist',
      album: 'Album',
      mbid: 'mbid-1',
      expiresAt: new Date(Date.now() + 100000),
    };
    const model = makeModel(doc);
    const repo = new MongoMbidCacheRepository(model as any);

    const res = await repo.findReleaseMbid('Artist', 'Album');
    expect(res).toBe('mbid-1');
  });

  it('upsertReleaseMbid writes release mbid with TTL', async () => {
    const model = makeModel();
    const repo = new MongoMbidCacheRepository(model as any);

    await repo.upsertReleaseMbid('Artist', 'Album', 'mbid-1', 3);

    expect(model.updateOne).toHaveBeenCalled();
    const call = (model.updateOne as jest.Mock).mock.calls[0];
    const filter = call[0];
    const update = call[1];
    const options = call[2];

    expect(filter).toEqual({ mbid: 'mbid-1' });
    expect(update.$set.artist).toBe('Artist');
    expect(update.$set.album).toBe('Album');
    expect(update.$set.mbid).toBe('mbid-1');
    expect(update.$set.fetchedAt).toBeInstanceOf(Date);
    expect(update.$set.expiresAt).toBeInstanceOf(Date);
    expect(options).toMatchObject({ upsert: true });

    const diff =
      update.$set.expiresAt.getTime() - update.$set.fetchedAt.getTime();
    expect(diff).toBe(3 * 24 * 60 * 60 * 1000);
  });
});
