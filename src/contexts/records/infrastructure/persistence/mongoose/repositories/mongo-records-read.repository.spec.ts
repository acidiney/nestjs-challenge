import { MongoRecordsReadRepository } from './mongo-records-read.repository';

describe('MongoRecordsReadRepository', () => {
  const makeRecordDoc = (over: any = {}) => ({
    _id: { toString: () => 'rec_1' },
    artist: 'The Beatles',
    album: 'Abbey Road',
    price: 25,
    qty: 10,
    category: 'Rock',
    format: 'Vinyl',
    created: new Date('2024-01-01T00:00:00.000Z'),
    lastModified: new Date('2024-01-02T00:00:00.000Z'),
    mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
    tracklist: [
      {
        title: 'Song A',
        length: '3:00',
        releaseDate: '1969-09-26',
        hasVideo: false,
      },
    ],
    ...over,
  });

  const makeFindChain = (docs: any[]) => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(docs),
    };
    return chain;
  };

  const makeModel = () => {
    const docs = [makeRecordDoc()];
    const findChain = makeFindChain(docs);
    return {
      find: jest.fn().mockReturnValue(findChain),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(2) }),
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(makeRecordDoc()),
        }),
      }),
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(makeRecordDoc()),
        }),
      }),
      __chain: findChain,
    } as any;
  };

  it('findAll returns mapped results and applies search projection and pagination', async () => {
    const model = makeModel();
    const repo = new MongoRecordsReadRepository(model as any);

    const results = await repo.findAll({
      search: 'Beatles',
      sort: 'relevance',
      page: 2,
      pageSize: 5,
    });

    expect(model.find).toHaveBeenCalledWith(
      expect.objectContaining({ $text: expect.any(Object) }),
    );
    expect(model.__chain.select).toHaveBeenCalledWith(
      expect.objectContaining({ score: { $meta: 'textScore' } }),
    );
    expect(model.__chain.sort).toHaveBeenCalledWith(
      expect.objectContaining({ score: { $meta: 'textScore' } }),
    );
    expect(model.__chain.skip).toHaveBeenCalledWith(5);
    expect(model.__chain.limit).toHaveBeenCalledWith(5);
    expect(Array.isArray(results)).toBe(true);
    expect(results[0]).toMatchObject({
      id: 'rec_1',
      artist: 'The Beatles',
      album: 'Abbey Road',
    });
  });

  it('count builds filter from query and returns numeric count', async () => {
    const model = makeModel();
    const repo = new MongoRecordsReadRepository(model as any);

    const total = await repo.count({
      search: 'Rock',
      category: 'Rock',
      format: 'Vinyl',
    });

    expect(model.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        $text: expect.any(Object),
        category: 'Rock',
        format: 'Vinyl',
      }),
    );
    expect(total).toBe(2);
  });

  it('findByUnique returns mapped model', async () => {
    const model = makeModel();
    const repo = new MongoRecordsReadRepository(model as any);

    const res = await repo.findByUnique('The Beatles', 'Abbey Road', 'Vinyl');

    expect(model.findOne).toHaveBeenCalledWith({
      artist: 'The Beatles',
      album: 'Abbey Road',
      format: 'Vinyl',
    });
    expect(res).toMatchObject({
      id: 'rec_1',
      artist: 'The Beatles',
      album: 'Abbey Road',
    });
  });

  it('findById returns mapped model', async () => {
    const model = makeModel();
    const repo = new MongoRecordsReadRepository(model as any);

    const res = await repo.findById('rec_1');

    expect(model.findById).toHaveBeenCalledWith('rec_1');
    expect(res).toMatchObject({
      id: 'rec_1',
      artist: 'The Beatles',
      album: 'Abbey Road',
    });
  });
});
