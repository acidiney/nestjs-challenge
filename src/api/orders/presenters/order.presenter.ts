import { OrderOutput } from '@/contexts/orders/application/outputs/order.output';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDecimal, IsInt, IsNotEmpty, Min } from 'class-validator';

export class OrderPresenter {
  @Expose()
  @ApiProperty({ description: 'Order ID' })
  @IsNotEmpty()
  id: string;

  @Expose()
  @ApiProperty({ description: 'Record ID' })
  @IsNotEmpty()
  recordId: string;

  @Expose()
  @ApiProperty({ description: 'Record title' })
  @IsNotEmpty()
  recordTitle: string;

  @Expose()
  @ApiProperty({ description: 'Quantity ordered' })
  @IsInt()
  @Min(1)
  quantity: number;

  @Expose()
  @ApiProperty({ description: 'Total price' })
  @IsDecimal()
  totalPrice: number;

  @Expose()
  @ApiProperty({ description: 'Unit price' })
  @IsDecimal()
  unitPrice: number;

  static fromOutput(model: OrderOutput): OrderPresenter {
    const presenter = new OrderPresenter();
    presenter.id = model.id;
    presenter.recordId = model.recordId;
    presenter.recordTitle = model.recordTitle;
    presenter.quantity = model.quantity;
    presenter.totalPrice = model.totalPrice;
    presenter.unitPrice = model.unitPrice;

    return presenter;
  }
}
