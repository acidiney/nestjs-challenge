import { CreateRecordInput } from '../../application/dtos/create-record.input';
import { UpdateRecordInput } from '../../application/dtos/update-record.input';
import { RecordModel } from '../models/record.model';

export interface RecordsRepository {
  create(dto: CreateRecordInput): Promise<RecordModel>;
  updateById(id: string, dto: UpdateRecordInput): Promise<RecordModel>;
}

export const RECORDS_REPOSITORY = Symbol('RECORDS_REPOSITORY');
