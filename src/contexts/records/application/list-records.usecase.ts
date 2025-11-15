import { Inject, Injectable } from '@nestjs/common';
import { ListRecordsQuery } from '../domain/queries/list-records.query';
import {
  RECORDS_READ_REPOSITORY,
  RecordsReadRepository,
} from '../domain/repositories/records-read.repository';
import { RecordOutput } from './outputs/record.output';

@Injectable()
export class ListRecordsUseCase {
  constructor(
    @Inject(RECORDS_READ_REPOSITORY)
    private readonly readRepo: RecordsReadRepository,
  ) {}

  async execute(query?: ListRecordsQuery): Promise<RecordOutput[]> {
    const records = await this.readRepo.findAll(query);
    return records.map(RecordOutput.fromModel);
  }
}
