import { MbidCacheRepository } from '@/contexts/records/domain/repositories/mbid-cache.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MBIDCache } from '../schemas/mbid-cache.schema';

export class MongoMbidCacheRepository implements MbidCacheRepository {
  constructor(
    @InjectModel('MBIDCache') private readonly model: Model<MBIDCache>,
  ) {}

  async findTracklist(mbid: string): Promise<string[] | null> {
    const now = new Date();

    const doc = await this.model
      .findOne({ mbid, expiresAt: { $gt: now } })
      .lean()
      .exec();

    if (!doc) return null;

    return doc.tracklist ?? [];
  }

  async upsertTracklist(
    mbid: string,
    tracklist: string[],
    ttlDays: number,
  ): Promise<void> {
    const fetchedAt = new Date();

    const PER_DAY_MS = 24 * 60 * 60 * 1000;

    const expiresAt = new Date(fetchedAt.getTime() + ttlDays * PER_DAY_MS);
    await this.model
      .updateOne(
        { mbid },
        { mbid, tracklist, fetchedAt, expiresAt },
        { upsert: true },
      )
      .exec();
  }
}
