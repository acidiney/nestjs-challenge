import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Record } from '../../../../../api/schemas/record.schema';
import { ListRecordsQuery } from '../../../domain/queries/list-records.query';
import { RecordsReadRepository } from '../../../domain/repositories/records-read.repository';

export class MongoRecordsReadRepository
  implements RecordsReadRepository<Record>
{
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async findAll(query?: ListRecordsQuery): Promise<Record[]> {
    const filter: any = {};
    const sort: any = {};

    if (query?.search) {
      filter.$text = { $search: query.search };
    }
    if (query?.category) {
      filter.category = query.category;
    }
    if (query?.format) {
      filter.format = query.format;
    }

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

    return results as any;
  }
}
