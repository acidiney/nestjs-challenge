import { RecordModel } from '../models/record.model';
import { ListRecordsQuery } from '../queries/list-records.query';

export interface RecordsReadRepository {
  findAll(query?: ListRecordsQuery): Promise<RecordModel[]>;
}

export const RECORDS_READ_REPOSITORY = Symbol('RECORDS_READ_REPOSITORY');
