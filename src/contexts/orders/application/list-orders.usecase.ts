import { Inject, Injectable } from '@nestjs/common';
import { OrderModel } from '../domain/models/order.model';
import {
  ORDERS_REPOSITORY,
  OrdersRepository,
} from '../domain/repositories/orders.repository';
import { OrderOutput } from './outputs/order.output';
import { OrdersPageOutput } from './outputs/orders-page.output';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly repo: OrdersRepository,
  ) {}

  async execute(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<OrdersPageOutput> {
    return Sentry.startSpan(
      { name: 'ListOrdersUseCase#execute', op: 'usecase' },
      async () => {
        const items: OrderModel[] = await this.repo.findAll(page, pageSize);
        const total = await this.repo.count();
        return {
          page,
          perPage: pageSize,
          total,
          data: items.map((o) => OrderOutput.fromModel(o)),
        };
      },
    );
  }
}
