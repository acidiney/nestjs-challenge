import { ListRecordsQuery } from '../queries/list-records.query';

export interface RecordsReadRepository<TRecord> {
  findAll(query?: ListRecordsQuery): Promise<TRecord[]>;
}

export const RECORDS_READ_REPOSITORY = Symbol('RECORDS_READ_REPOSITORY');
