import { Module } from '@nestjs/common';
import { OrderModule } from './orders/order.module';
import { RecordModule } from './records/record.module';

@Module({
  imports: [RecordModule, OrderModule],
})
export class ApiModule {}
