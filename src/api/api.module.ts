import { CacheInvalidationListener } from '@/infrastructure/cache/cache-invalidation.listener';
import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { OrderModule } from './orders/order.module';
import { RecordModule } from './records/record.module';

@Module({
  imports: [RecordModule, OrderModule, AdminModule],
  providers: [CacheInvalidationListener],
})
export class ApiModule {}
