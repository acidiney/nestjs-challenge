import { OrderOutput } from './order.output';

export type OrdersPageOutput = Readonly<{
  page: number;
  total: number;
  data: ReadonlyArray<OrderOutput>;
  perPage: number;
}>;
