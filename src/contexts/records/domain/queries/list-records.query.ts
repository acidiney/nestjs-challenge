import { RecordSortParam } from './sort.types';

export interface ListRecordsQuery {
  search?: string;
  category?: string;
  format?: string;
  sort?: RecordSortParam;
  page?: number;
  pageSize?: number;
}
