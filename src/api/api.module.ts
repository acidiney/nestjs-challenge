import { Module } from '@nestjs/common';
import { RecordModule } from './records/record.module';

@Module({
  imports: [RecordModule],
})
export class ApiModule {}
