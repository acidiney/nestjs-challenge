import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderModel } from '../domain/models/order.model';
import {
  ORDERS_REPOSITORY,
  OrdersRepository,
} from '../domain/repositories/orders.repository';
import { CreateOrderInput } from './inputs/create-order.input';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly repo: OrdersRepository,
    private readonly events: EventEmitter2 = new EventEmitter2(),
  ) {}

  async execute(dto: CreateOrderInput): Promise<OrderModel> {
    const order = await this.repo.create(dto);
    this.events.emit('cache.invalidate', 'record:list');
    return order;
  }
}
