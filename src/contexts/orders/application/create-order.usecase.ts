import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../domain/models/order';
import {
  ORDERS_REPOSITORY,
  OrdersRepository,
} from '../domain/repositories/orders.repository';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly repo: OrdersRepository<Order>,
  ) {}

  async execute(dto: Partial<Order>): Promise<Order> {
    return this.repo.create(dto);
  }
}
