import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as Sentry from '@sentry/nestjs';
import {
  ORDERS_REPOSITORY,
  OrdersRepository,
} from '../domain/repositories/orders.repository';
import { CreateOrderInput } from './inputs/create-order.input';
import { OrderOutput } from './outputs/order.output';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly repo: OrdersRepository,
    private readonly events: EventEmitter2 = new EventEmitter2(),
  ) {}

  async execute(dto: CreateOrderInput): Promise<OrderOutput> {
    return Sentry.startSpan(
      { name: 'CreateOrderUseCase#execute', op: 'usecase' },
      async () => {
        const order = await this.repo.create(dto);
        this.events.emit('cache.invalidate', '/records');
        return OrderOutput.fromModel(order);
      },
    );
  }
}
