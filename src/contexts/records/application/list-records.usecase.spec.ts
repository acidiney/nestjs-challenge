import { RecordModel } from '../domain/models/record.model';
import { ListRecordsQuery } from '../domain/queries/list-records.query';
import { ListRecordsUseCase } from './list-records.usecase';

describe('ListRecordsUseCase', () => {
  const models: RecordModel[] = [
    {
      id: 'rec_1',
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: 'Vinyl',
      category: 'Rock',
      created: new Date('2024-01-01T00:00:00.000Z'),
      lastModified: new Date('2024-01-02T00:00:00.000Z'),
    },
    {
      id: 'rec_2',
      artist: 'Pink Floyd',
      album: 'The Dark Side of the Moon',
      price: 30,
      qty: 5,
      format: 'Vinyl',
      category: 'Rock',
      created: new Date('2024-02-01T00:00:00.000Z'),
      lastModified: new Date('2024-02-02T00:00:00.000Z'),
    },
  ];

  it('returns paginated outputs from repository results', async () => {
    const readRepo = {
      findAll: jest.fn().mockResolvedValue(models),
      count: jest.fn().mockResolvedValue(2),
    };
    const usecase = new ListRecordsUseCase(readRepo as any);

    const payload = await usecase.execute();

    expect(readRepo.findAll).toHaveBeenCalledWith(undefined);
    expect(readRepo.count).toHaveBeenCalledWith(undefined);
    expect(payload).toMatchObject({ page: 1, perPage: 20, total: 2 });
    expect(payload.data).toHaveLength(2);
    expect(payload.data[0]).toMatchObject({
      id: 'rec_1',
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: 'Vinyl',
      category: 'Rock',
    });
  });

  it('passes query to repository and returns empty data when none found', async () => {
    const readRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    };
    const usecase = new ListRecordsUseCase(readRepo as any);

    const query: ListRecordsQuery = {
      search: 'Beatles',
      category: 'Rock',
      format: 'Vinyl',
      sort: 'price',
      page: 2,
      pageSize: 5,
    };

    const payload = await usecase.execute(query);

    expect(readRepo.findAll).toHaveBeenCalledWith(query);
    expect(readRepo.count).toHaveBeenCalledWith(query);
    expect(payload).toMatchObject({ page: 2, perPage: 5, total: 0 });
    expect(payload.data).toEqual([]);
  });
});
