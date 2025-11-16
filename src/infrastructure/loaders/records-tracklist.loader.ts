import {
  MUSIC_METADATA_SERVICE,
  MusicMetadataService,
} from '@/contexts/records/application/services/music-metadata.service';
import { MBID } from '@/contexts/records/domain/value-objects/mbid.vo';
import { RecordDocument } from '@/contexts/records/infrastructure/persistence/mongoose/schemas/record.schema';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class RecordsTracklistLoader implements OnModuleInit {
  private readonly logger = new Logger(RecordsTracklistLoader.name);

  constructor(
    @InjectModel('Record')
    private readonly recordModel: Model<RecordDocument>,
    @Inject(MUSIC_METADATA_SERVICE)
    private readonly metadata: MusicMetadataService,
  ) {}

  async onModuleInit(): Promise<void> {
    setImmediate(() => {
      this.run().catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error('Backfill task crashed', message);
      });
    });
  }

  private async run(): Promise<void> {
    try {
      const filter: any = {
        mbid: { $exists: true, $ne: null },
        $or: [{ tracklist: { $exists: false } }, { tracklist: { $size: 0 } }],
      };

      const candidates = await this.recordModel.find(filter).lean().exec();
      if (!candidates.length) {
        return;
      }

      const BATCH_SIZE = 10;
      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (rec) => {
            try {
              const mbid = MBID.from(String(rec.mbid));

              const tracklist = await this.metadata.fetchTrackInfosByMbid(mbid);

              if (Array.isArray(tracklist) && tracklist.length > 0) {
                await this.recordModel
                  .updateOne({ _id: rec._id }, { $set: { tracklist } })
                  .exec();
                this.logger.log(
                  `Backfilled tracklist for record=${rec._id} mbid=${rec.mbid} count=${tracklist.length}`,
                );
                return;
              }

              this.logger.warn(
                `No tracklist found for mbid=${rec.mbid} record=${rec._id}`,
              );
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              this.logger.warn(
                `Backfill failed for record=${rec._id} mbid=${rec.mbid}: ${message}`,
              );
            }
          }),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('Backfill task crashed', message);
    }
  }
}
