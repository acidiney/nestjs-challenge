export interface OrdersRepository<TOrder> {
  create(dto: Partial<TOrder>): Promise<TOrder>;
  updateById(id: string, dto: Partial<TOrder>): Promise<TOrder>;
}

export const ORDERS_REPOSITORY = Symbol('ORDERS_REPOSITORY');
