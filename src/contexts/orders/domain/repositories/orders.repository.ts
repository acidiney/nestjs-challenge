import { CreateOrderInput } from '../../application/inputs/create-order.input';
import { OrderModel } from '../models/order.model';

export interface OrdersRepository {
  create(dto: CreateOrderInput): Promise<OrderModel>;
  findAll(page?: number, pageSize?: number): Promise<OrderModel[]>;
  count(): Promise<number>;
}

export const ORDERS_REPOSITORY = Symbol('ORDERS_REPOSITORY');
