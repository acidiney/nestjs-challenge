import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRecordUseCase } from '../contexts/records/application/create-record.usecase';
import { ListRecordsUseCase } from '../contexts/records/application/list-records.usecase';
import { UpdateRecordUseCase } from '../contexts/records/application/update-record.usecase';
import { RECORDS_READ_REPOSITORY } from '../contexts/records/domain/repositories/records-read.repository';
import { RECORDS_REPOSITORY } from '../contexts/records/domain/repositories/records.repository';
import { MongoRecordsReadRepository } from '../contexts/records/infrastructure/persistence/mongoose/mongo-records-read.repository';
import { MongoRecordsRepository } from '../contexts/records/infrastructure/persistence/mongoose/mongo-records.repository';
import { RecordController } from './controllers/record.controller';
import { RecordDocument, RecordSchema } from './schemas/record.schema';
import { RecordService } from './services/record.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Record', schema: RecordSchema }]),
  ],
  controllers: [RecordController],
  providers: [
    RecordService,
    { provide: RECORDS_READ_REPOSITORY, useClass: MongoRecordsReadRepository },
    { provide: RECORDS_REPOSITORY, useClass: MongoRecordsRepository },
    CreateRecordUseCase,
    UpdateRecordUseCase,
    ListRecordsUseCase,
  ],
})
export class RecordModule implements OnModuleInit {
  private readonly logger = new Logger(RecordModule.name);

  constructor(
    @InjectModel('Record')
    private readonly recordModel: Model<RecordDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.recordModel.syncIndexes();
    } catch (err) {
      const trace = err instanceof Error ? err.stack : String(err);
      this.logger.error('Failed to sync Record indexes', trace);
    }
  }
}
