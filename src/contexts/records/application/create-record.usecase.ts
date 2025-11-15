import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  RECORDS_READ_REPOSITORY,
  RecordsReadRepository,
} from '../domain/repositories/records-read.repository';
import {
  RECORDS_REPOSITORY,
  RecordsRepository,
} from '../domain/repositories/records.repository';
import { CreateRecordInput } from './inputs/create-record.input';
import { RecordOutput } from './outputs/record.output';

@Injectable()
export class CreateRecordUseCase {
  constructor(
    @Inject(RECORDS_REPOSITORY)
    private readonly repo: RecordsRepository,
    @Inject(RECORDS_READ_REPOSITORY)
    private readonly readRepo: RecordsReadRepository,
  ) {}

  async execute(dto: CreateRecordInput): Promise<RecordOutput> {
    const existing = await this.readRepo.findByUnique(
      dto.artist,
      dto.album,
      dto.format,
    );

    if (existing) {
      throw new ConflictException('Record already exists');
    }

    const created = await this.repo.create(dto);
    return RecordOutput.fromModel(created);
  }
}
