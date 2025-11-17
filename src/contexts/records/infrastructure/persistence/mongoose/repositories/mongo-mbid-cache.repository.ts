import { MbidCacheRepository } from '@/contexts/records/domain/repositories/mbid-cache.repository';
import { Tracklist } from '@/contexts/records/domain/types/tracklist.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MBIDCache } from '../schemas/mbid-cache.schema';

const PER_DAY_MS = 24 * 60 * 60 * 1000;

export class MongoMbidCacheRepository implements MbidCacheRepository {
  constructor(
    @InjectModel('MBIDCache') private readonly model: Model<MBIDCache>,
  ) {}

  async findTracklist(mbid: string): Promise<Tracklist[] | null> {
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
    tracklist: Tracklist[],
    ttlDays: number,
  ): Promise<void> {
    const fetchedAt = new Date();

    const expiresAt = new Date(fetchedAt.getTime() + ttlDays * PER_DAY_MS);
    await this.model
      .updateOne(
        { mbid },
        { $set: { tracklist, mbid, fetchedAt, expiresAt } },
        { upsert: true },
      )
      .exec();
  }

  async findReleaseMbid(artist: string, album: string): Promise<string | null> {
    const now = new Date();

    const doc = await this.model
      .findOne({ artist, album, expiresAt: { $gt: now } })
      .lean()
      .exec();

    if (!doc) return null;

    return doc.mbid;
  }

  async updateReleaseMbid(
    artist: string,
    album: string,
    mbid: string,
    ttlDays: number,
  ): Promise<void> {
    const fetchedAt = new Date();

    const expiresAt = new Date(fetchedAt.getTime() + ttlDays * PER_DAY_MS);
    await this.model
      .updateOne(
        { mbid },
        { $set: { artist, album, mbid, fetchedAt, expiresAt } },
        { upsert: false },
      )
      .exec();
  }
}
