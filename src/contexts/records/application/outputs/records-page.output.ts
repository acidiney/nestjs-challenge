import { RecordOutput } from './record.output';

export type RecordsPageOutput = Readonly<{
  page: number;
  total: number;
  data: ReadonlyArray<RecordOutput>;
  perPage: number;
}>;
