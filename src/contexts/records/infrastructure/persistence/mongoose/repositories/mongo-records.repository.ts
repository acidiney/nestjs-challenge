import { InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateRecordInput } from '@/contexts/records/application/inputs/create-record.input';
import { UpdateRecordInput } from '@/contexts/records/application/inputs/update-record.input';
import { RecordsRepository } from '../../../../domain/repositories/records.repository';
import { Record } from '../schemas/record.schema';
import * as Sentry from '@sentry/nestjs';

export class MongoRecordsRepository implements RecordsRepository {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(dto: CreateRecordInput): Promise<Record> {
    return Sentry.startSpan(
      { name: 'MongoRecordsRepository#create', op: 'db' },
      async () => {
        return this.recordModel.create({
          artist: dto.artist,
          album: dto.album,
          price: dto.price,
          qty: dto.qty,
          format: dto.format,
          category: dto.category,
          mbid: dto.mbid?.toString(),
          tracklist: dto.tracklist ?? [],
        });
      },
    );
  }

  async updateById(id: string, dto: UpdateRecordInput): Promise<void> {
    return Sentry.startSpan(
      { name: 'MongoRecordsRepository#updateById', op: 'db' },
      async () => {
        const set: any = { ...dto };
        if (dto.mbid !== undefined && dto.mbid !== null) {
          set.mbid = dto.mbid.toString();
        } else {
          delete set.mbid;
        }

        const update: any = { $set: set };
        if (dto.mbid === undefined || dto.mbid === null) {
          update.$unset = { mbid: '' };
        }

        const updated = await this.recordModel.updateOne({ _id: id }, update, {
          upsert: false,
        });

        if (!updated) {
          throw new InternalServerErrorException('Failed to update record');
        }
      },
    );
  }
}
