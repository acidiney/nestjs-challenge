import { CreateRecordInput } from '../../application/inputs/create-record.input';
import { UpdateRecordInput } from '../../application/inputs/update-record.input';
import { RecordModel } from '../models/record.model';

export interface RecordsRepository {
  create(dto: CreateRecordInput): Promise<RecordModel>;
  updateById(id: string, dto: UpdateRecordInput): Promise<void>;
}

export const RECORDS_REPOSITORY = Symbol('RECORDS_REPOSITORY');
