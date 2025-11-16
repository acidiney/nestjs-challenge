import { Inject, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { ListRecordsQuery } from '../domain/queries/list-records.query';
import {
  RECORDS_READ_REPOSITORY,
  RecordsReadRepository,
} from '../domain/repositories/records-read.repository';
import { RecordOutput } from './outputs/record.output';
import { RecordsPageOutput } from './outputs/records-page.output';

@Injectable()
export class ListRecordsUseCase {
  constructor(
    @Inject(RECORDS_READ_REPOSITORY)
    private readonly readRepo: RecordsReadRepository,
  ) {}

  async execute(query?: ListRecordsQuery): Promise<RecordsPageOutput> {
    return Sentry.startSpan(
      { name: 'ListRecordsUseCase#execute', op: 'usecase' },
      async () => {
        const page = query?.page && query.page > 0 ? query.page : 1;
        const perPage =
          query?.pageSize && query.pageSize > 0 ? query.pageSize : 20;

        const [records, total] = await Promise.all([
          this.readRepo.findAll(query),
          this.readRepo.count(query),
        ]);
        const data = records.map(RecordOutput.fromModel);
        return {
          page: Number(page),
          total,
          data,
          perPage: Number(perPage),
        };
      },
    );
  }
}
