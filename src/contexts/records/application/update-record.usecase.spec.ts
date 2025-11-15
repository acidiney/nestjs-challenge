import { RecordModel } from '../domain/models/record.model';
import { UpdateRecordInput } from './inputs/update-record.input';
import { UpdateRecordUseCase } from './update-record.usecase';

describe('UpdateRecordUseCase', () => {
  const makeModel = (): RecordModel => ({
    id: 'rec_123',
    artist: 'The Beatles',
    album: 'Abbey Road',
    price: 25,
    qty: 10,
    format: 'Vinyl',
    category: 'Rock',
    created: new Date('2024-01-01T00:00:00.000Z'),
    lastModified: new Date('2024-01-01T00:00:00.000Z'),
    mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
  });

  it('updates a record by id and maps the output', async () => {
    const repo = { updateById: jest.fn().mockResolvedValue(undefined) };
    const readRepo = { findById: jest.fn().mockResolvedValue(makeModel()) };
    const metadata = { fetchTracklistByMbid: jest.fn() };

    const usecase = new UpdateRecordUseCase(
      repo as any,
      readRepo as any,
      metadata as any,
    );
    const id = 'rec_123';
    const dto: UpdateRecordInput = { price: 30 };

    const output = await usecase.execute(id, dto);

    expect(readRepo.findById).toHaveBeenCalledWith(id);
    expect(repo.updateById).toHaveBeenCalledWith(
      id,
      expect.objectContaining({ price: 30 }),
    );
    expect(output).toMatchObject({
      id: 'rec_123',
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 30,
      qty: 10,
      format: 'Vinyl',
      category: 'Rock',
    });
  });

  it('propagates repository errors', async () => {
    const repo = {
      updateById: jest.fn().mockRejectedValue(new Error('Record not found')),
    };
    const readRepo = { findById: jest.fn().mockResolvedValue(makeModel()) };
    const metadata = { fetchTracklistByMbid: jest.fn() };

    const usecase = new UpdateRecordUseCase(
      repo as any,
      readRepo as any,
      metadata as any,
    );
    const id = 'rec_404';
    const dto: UpdateRecordInput = { price: 30 };

    await expect(usecase.execute(id, dto)).rejects.toThrow('Record not found');
    expect(readRepo.findById).toHaveBeenCalledWith(id);
    expect(repo.updateById).toHaveBeenCalledWith(
      id,
      expect.objectContaining({ price: 30 }),
    );
  });
});
