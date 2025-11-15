import { Inject, Injectable } from '@nestjs/common';
import { Record } from '../../../api/schemas/record.schema';
import { ListRecordsQuery } from '../../records/domain/queries/list-records.query';
import {
  RECORDS_READ_REPOSITORY,
  RecordsReadRepository,
} from '../../records/domain/repositories/records-read.repository';

@Injectable()
export class ListRecordsUseCase {
  constructor(
    @Inject(RECORDS_READ_REPOSITORY)
    private readonly readRepo: RecordsReadRepository<Record>,
  ) {}

  async execute(query?: ListRecordsQuery): Promise<Record[]> {
    return this.readRepo.findAll(query);
  }
}
