import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RecordModel } from '@/contexts/records/domain/models/record.model';
import { ListRecordsQuery } from '../../../../domain/queries/list-records.query';
import { RecordsReadRepository } from '../../../../domain/repositories/records-read.repository';
import { Record } from '../schemas/record.schema';

export class MongoRecordsReadRepository implements RecordsReadRepository {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  private buildFilter(query?: ListRecordsQuery): any {
    const filter: any = {};
    if (query?.search) {
      filter.$text = { $search: query.search };
    }
    if (query?.category) {
      filter.category = query.category;
    }
    if (query?.format) {
      filter.format = query.format;
    }
    return filter;
  }

  private buildSort(query?: ListRecordsQuery): any {
    const sort: any = {};
    switch (query?.sort) {
      case 'price':
        sort.price = 1;
        break;
      case 'created':
        sort.created = -1;
        break;
      case 'relevance':
        if (query?.search) {
          sort.$textScore = { $meta: 'textScore' };
        }
        break;
      case 'artist':
        sort.artist = 1;
        break;
      case 'album':
        sort.album = 1;
        break;
      default:
        sort.created = -1;
    }
    return sort;
  }

  private mapToModel(record: Record): RecordModel {
    return {
      id: record._id.toString(),
      artist: record.artist,
      album: record.album,
      price: record.price,
      qty: record.qty,
      category: record.category,
      format: record.format,
      created: record.created,
      lastModified: record.lastModified,
      mbid: record.mbid,
      tracklist: (record as any).tracklist,
    };
  }

  async findAll(query?: ListRecordsQuery): Promise<RecordModel[]> {
    const filter = this.buildFilter(query);
    const sort = this.buildSort(query);

    const page = query?.page && query.page > 0 ? query.page : 1;
    const pageSize =
      query?.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const results = await this.recordModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec();

    return results.map(this.mapToModel);
  }

  async count(query?: ListRecordsQuery): Promise<number> {
    const filter: any = this.buildFilter(query);
    return this.recordModel.countDocuments(filter).exec();
  }

  async findByUnique(
    artist: string,
    album: string,
    format: string,
  ): Promise<RecordModel | null> {
    const result = await this.recordModel
      .findOne({ artist, album, format })
      .lean()
      .exec();
    return result && this.mapToModel(result);
  }

  async findById(id: string): Promise<RecordModel | null> {
    const result = await this.recordModel.findById(id).lean().exec();

    return result && this.mapToModel(result);
  }
}
