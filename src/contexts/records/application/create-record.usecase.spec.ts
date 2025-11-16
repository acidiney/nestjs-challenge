import { ConflictException } from '@nestjs/common';
import { RecordModel } from '../domain/models/record.model';
import { MBID } from '../domain/value-objects/mbid.vo';
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
    mbid: MBID.from('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d'),
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

  it('creates a record when no duplicate exists (no mbid)', async () => {
    const repo = { create: jest.fn().mockResolvedValue(makeCreatedModel()) };
    const readRepo = { findByUnique: jest.fn().mockResolvedValue(null) };
    const metadata = { fetchTracklistByMbid: jest.fn() };

    const usecase = new CreateRecordUseCase(
      repo as any,
      readRepo as any,
      metadata as any,
    );
    const input = makeInput();
    delete (input as any).mbid;

    const output = await usecase.execute(input);

    expect(readRepo.findByUnique).toHaveBeenCalledWith(
      input.artist,
      input.album,
      input.format,
    );
    expect(repo.create).toHaveBeenCalledWith({
      ...input,
      tracklist: undefined,
    });

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
    const metadata = { fetchTracklistByMbid: jest.fn() };
    const usecase = new CreateRecordUseCase(
      repo as any,
      readRepo as any,
      metadata as any,
    );
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

  it('fetches tracklist when valid mbid provided', async () => {
    const created = { ...makeCreatedModel(), tracklist: ['T1', 'T2'] };
    const repo = { create: jest.fn().mockResolvedValue(created) };
    const readRepo = { findByUnique: jest.fn().mockResolvedValue(null) };
    const metadata = {
      fetchTrackInfosByMbid: jest.fn().mockResolvedValue(['T1', 'T2']),
    };
    const usecase = new CreateRecordUseCase(
      repo as any,
      readRepo as any,
      metadata as any,
    );
    const input = makeInput();

    const output = await usecase.execute(input);
    expect(metadata.fetchTrackInfosByMbid).toHaveBeenCalledWith(input.mbid);
    expect(repo.create).toHaveBeenCalledWith({
      ...input,
      tracklist: ['T1', 'T2'],
    });
    expect(output.tracklist).toEqual(['T1', 'T2']);
  });
});
