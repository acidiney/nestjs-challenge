import { MUSIC_METADATA_SERVICE } from '@/contexts/records/application/services/music-metadata.service';
import { MBID_CACHE_REPOSITORY } from '@/contexts/records/domain/repositories/mbid-cache.repository';
import { MusicBrainzService } from '@/contexts/records/infrastructure/external/musicbrainz.service';
import { MongoMbidCacheRepository } from '@/contexts/records/infrastructure/persistence/mongoose/repositories/mongo-mbid-cache.repository';
import { MBIDCacheSchema } from '@/contexts/records/infrastructure/persistence/mongoose/schemas/mbid-cache.schema';
import {
  RecordDocument,
  RecordSchema,
} from '@/contexts/records/infrastructure/persistence/mongoose/schemas/record.schema';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRecordUseCase } from '../../contexts/records/application/create-record.usecase';
import { ListRecordsUseCase } from '../../contexts/records/application/list-records.usecase';
import { UpdateRecordUseCase } from '../../contexts/records/application/update-record.usecase';
import { RECORDS_READ_REPOSITORY } from '../../contexts/records/domain/repositories/records-read.repository';
import { RECORDS_REPOSITORY } from '../../contexts/records/domain/repositories/records.repository';
import { MongoRecordsReadRepository } from '../../contexts/records/infrastructure/persistence/mongoose/repositories/mongo-records-read.repository';
import { MongoRecordsRepository } from '../../contexts/records/infrastructure/persistence/mongoose/repositories/mongo-records.repository';
import { RecordsTracklistLoader } from '../../infrastructure/loaders/records-tracklist.loader';
import { RecordController } from './controllers/record.controller';
import * as Sentry from '@sentry/nestjs';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Record', schema: RecordSchema },
      { name: 'MBIDCache', schema: MBIDCacheSchema },
    ]),
  ],
  controllers: [RecordController],
  providers: [
    { provide: RECORDS_READ_REPOSITORY, useClass: MongoRecordsReadRepository },
    { provide: RECORDS_REPOSITORY, useClass: MongoRecordsRepository },
    { provide: MUSIC_METADATA_SERVICE, useClass: MusicBrainzService },
    { provide: MBID_CACHE_REPOSITORY, useClass: MongoMbidCacheRepository },
    CreateRecordUseCase,
    UpdateRecordUseCase,
    ListRecordsUseCase,
    RecordsTracklistLoader,
  ],
})
export class RecordModule implements OnModuleInit {
  private readonly logger = new Logger(RecordModule.name);

  constructor(
    @InjectModel('Record')
    private readonly recordModel: Model<RecordDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    return Sentry.startSpan(
      { name: 'RecordModule#onModuleInit', op: 'init' },
      async () => {
        try {
          await this.recordModel.syncIndexes();
        } catch (err) {
          const trace = err instanceof Error ? err.stack : String(err);
          this.logger.error('Failed to sync Record indexes', trace);
        }
      },
    );
  }
}
