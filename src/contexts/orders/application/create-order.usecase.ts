import { Inject, Injectable } from '@nestjs/common';
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
  ) {}

  async execute(dto: CreateOrderInput): Promise<OrderModel> {
    return this.repo.create(dto);
  }
}
