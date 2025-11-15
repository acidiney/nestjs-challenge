import { MongoRecordsRepository } from './mongo-records.repository';

describe('MongoRecordsRepository', () => {
  const makeModel = () => ({
    create: jest.fn().mockResolvedValue({ _id: 'r1' }),
    updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
  });

  it('create passes all fields including optional tracklist/mbid', async () => {
    const model = makeModel();
    const repo = new MongoRecordsRepository(model as any);
    const dto: any = {
      artist: 'A',
      album: 'B',
      price: 10,
      qty: 1,
      format: 'Vinyl',
      category: 'Rock',
      mbid: { toString: () => 'mbid-1' },
      tracklist: ['t1'],
    };
    const res = await repo.create(dto);
    expect(res).toMatchObject({ _id: 'r1' });
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ mbid: 'mbid-1', tracklist: ['t1'] }),
    );
  });

  it('updateById calls updateOne and does not throw on acknowledged', async () => {
    const model = makeModel();
    const repo = new MongoRecordsRepository(model as any);
    await repo.updateById('id1', { price: 20 } as any);
    expect(model.updateOne).toHaveBeenCalled();
  });

  it('updateById throws when updateOne returns falsy', async () => {
    const model = makeModel();
    (model.updateOne as any).mockResolvedValue(null);
    const repo = new MongoRecordsRepository(model as any);
    await expect(
      repo.updateById('id1', { price: 20 } as any),
    ).rejects.toBeInstanceOf(Error);
  });
});
