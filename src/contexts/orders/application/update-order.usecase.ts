import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../domain/models/order';
import {
  ORDERS_REPOSITORY,
  OrdersRepository,
} from '../domain/repositories/orders.repository';

@Injectable()
export class UpdateOrderUseCase {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly repo: OrdersRepository<Order>,
  ) {}

  async execute(id: string, dto: Partial<Order>): Promise<Order> {
    return this.repo.updateById(id, dto);
  }
}
