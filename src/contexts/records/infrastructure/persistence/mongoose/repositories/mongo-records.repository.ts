import { InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateRecordInput } from '@/contexts/records/application/inputs/create-record.input';
import { UpdateRecordInput } from '@/contexts/records/application/inputs/update-record.input';
import { RecordsRepository } from '../../../../domain/repositories/records.repository';
import { Record } from '../schemas/record.schema';

export class MongoRecordsRepository implements RecordsRepository {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(dto: CreateRecordInput): Promise<Record> {
    return this.recordModel.create({
      artist: dto.artist,
      album: dto.album,
      price: dto.price,
      qty: dto.qty,
      format: dto.format,
      category: dto.category,
      mbid: dto.mbid,
    });
  }

  async updateById(id: string, dto: UpdateRecordInput): Promise<Record> {
    const record = await this.recordModel.findById(id);
    if (!record) {
      throw new InternalServerErrorException('Record not found');
    }
    Object.assign(record, dto);
    const updated = await this.recordModel.updateOne(record);
    if (!updated) {
      throw new InternalServerErrorException('Failed to update record');
    }
    return record as any;
  }
}
