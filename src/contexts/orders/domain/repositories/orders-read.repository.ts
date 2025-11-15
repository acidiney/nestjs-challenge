import { ListOrdersQuery } from '../queries/list-orders.query';

export interface OrdersReadRepository<TOrder> {
  findAll(query?: ListOrdersQuery): Promise<TOrder[]>;
}

export const ORDERS_READ_REPOSITORY = Symbol('ORDERS_READ_REPOSITORY');
