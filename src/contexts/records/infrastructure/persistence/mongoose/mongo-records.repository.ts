import { InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRecordRequestDTO } from '../../../../../api/dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../../../../../api/dtos/update-record.request.dto';
import { Record } from '../../../../../api/schemas/record.schema';
import { RecordsRepository } from '../../../domain/repositories/records.repository';

export class MongoRecordsRepository
  implements
    RecordsRepository<Record, CreateRecordRequestDTO, UpdateRecordRequestDTO>
{
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(dto: CreateRecordRequestDTO): Promise<Record> {
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

  async updateById(id: string, dto: UpdateRecordRequestDTO): Promise<Record> {
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
