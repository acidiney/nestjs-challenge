import { Module } from '@nestjs/common';
import { CacheInvalidationListener } from '@/infrastructure/cache/cache-invalidation.listener';
import { OrderModule } from './orders/order.module';
import { RecordModule } from './records/record.module';

@Module({
  imports: [RecordModule, OrderModule],
  providers: [CacheInvalidationListener],
})
export class ApiModule {}
