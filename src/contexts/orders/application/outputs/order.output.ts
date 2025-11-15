import { OrderModel } from '../../domain/models/order.model';

export class OrderOutput {
  id?: string;
  recordId?: string;
  quantity?: number;
  totalPrice?: number;
  unitPrice?: number;

  constructor(props: OrderModel) {
    this.id = props.id;
    this.recordId = props.recordId;
    this.quantity = props.quantity;
    this.totalPrice = props.totalPrice;
    this.unitPrice = props.unitPrice;
  }

  static fromModel(model: OrderModel): OrderOutput {
    return new OrderOutput(model);
  }
}
