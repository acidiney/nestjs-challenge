import { CreateOrderUseCase } from '@/contexts/orders/application/create-order.usecase';
import { ListOrdersUseCase } from '@/contexts/orders/application/list-orders.usecase';
import { ORDERS_REPOSITORY } from '@/contexts/orders/domain/repositories/orders.repository';
import { MongoOrdersRepository } from '@/contexts/orders/infrastructure/persistence/mongoose/repositories/mongo-orders.repository';
import { OrderSchema } from '@/contexts/orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { RecordSchema } from '@/contexts/records/infrastructure/persistence/mongoose/schemas/record.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './controllers/order.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Record', schema: RecordSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [
    { provide: ORDERS_REPOSITORY, useClass: MongoOrdersRepository },
    CreateOrderUseCase,
    ListOrdersUseCase,
  ],
})
export class OrderModule {}
