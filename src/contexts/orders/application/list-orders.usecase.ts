import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../domain/models/order';
import { ListOrdersQuery } from '../domain/queries/list-orders.query';
import {
  ORDERS_READ_REPOSITORY,
  OrdersReadRepository,
} from '../domain/repositories/orders-read.repository';

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDERS_READ_REPOSITORY)
    private readonly readRepo: OrdersReadRepository<Order>,
  ) {}

  async execute(query?: ListOrdersQuery): Promise<Order[]> {
    return this.readRepo.findAll(query);
  }
}
