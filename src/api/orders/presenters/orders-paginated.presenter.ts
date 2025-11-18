import { PaginationPresenter } from '@/common/presenters/pagination.presenter';
import { OrdersPageOutput } from '@/contexts/orders/application/outputs/orders-page.output';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { OrderPresenter } from './order.presenter';

export class OrdersPaginatedPresenter extends PaginationPresenter {
  @Expose()
  @ApiProperty({ description: 'List of items', type: () => [OrderPresenter] })
  @IsArray()
  @Type(() => OrderPresenter)
  @ValidateNested({ each: true })
  data: ReadonlyArray<OrderPresenter>;

  static fromOutput(model: OrdersPageOutput): OrdersPaginatedPresenter {
    const presenter = new OrdersPaginatedPresenter();

    presenter.page = model.page;
    presenter.total = model.total;
    presenter.perPage = model.perPage;
    presenter.data = model.data.map(OrderPresenter.fromOutput);

    return presenter;
  }
}
