import { ConflictException } from '@nestjs/common';
import { RecordModel } from '../domain/models/record.model';
import { CreateRecordUseCase } from './create-record.usecase';
import { CreateRecordInput } from './inputs/create-record.input';

describe('CreateRecordUseCase', () => {
  const makeInput = (): CreateRecordInput => ({
    artist: 'The Beatles',
    album: 'Abbey Road',
    price: 25,
    qty: 10,
    format: 'Vinyl',
    category: 'Rock',
    mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
  });

  const makeCreatedModel = (): RecordModel => ({
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

  it('creates a record when no duplicate exists', async () => {
    const repo = { create: jest.fn().mockResolvedValue(makeCreatedModel()) };
    const readRepo = { findByUnique: jest.fn().mockResolvedValue(null) };

    const usecase = new CreateRecordUseCase(repo as any, readRepo as any);
    const input = makeInput();

    const output = await usecase.execute(input);

    expect(readRepo.findByUnique).toHaveBeenCalledWith(
      input.artist,
      input.album,
      input.format,
    );
    expect(repo.create).toHaveBeenCalledWith(input);

    expect(output).toMatchObject({
      id: 'rec_123',
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: 'Vinyl',
      category: 'Rock',
      mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
    });
  });

  it('throws ConflictException when duplicate exists', async () => {
    const repo = { create: jest.fn() };
    const readRepo = {
      findByUnique: jest.fn().mockResolvedValue(makeCreatedModel()),
    };

    const usecase = new CreateRecordUseCase(repo as any, readRepo as any);
    const input = makeInput();

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(readRepo.findByUnique).toHaveBeenCalledWith(
      input.artist,
      input.album,
      input.format,
    );
    expect(repo.create).not.toHaveBeenCalled();
  });
});
