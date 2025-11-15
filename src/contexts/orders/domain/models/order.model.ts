export interface OrderModel {
  id?: string;
  recordId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  created?: Date;
}
