export interface OrderModel {
  id?: string;
  recordId: string;
  recordTitle?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  created?: Date;
}
