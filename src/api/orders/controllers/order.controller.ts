import { CreateOrderUseCase } from '@/contexts/orders/application/create-order.usecase';
import { ListOrdersUseCase } from '@/contexts/orders/application/list-orders.usecase';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { OrderPresenter } from '../presenters/order.presenter';
import { OrdersPaginatedPresenter } from '../presenters/orders-paginated.presenter';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiCreatedResponse({
    description: 'Order successfully created',
    type: OrderPresenter,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiNotFoundResponse({ description: 'Record not found' })
  @ApiConflictResponse({ description: 'Insufficient stock' })
  async create(
    @Body() request: CreateOrderRequestDTO,
  ): Promise<OrderPresenter> {
    return Sentry.startSpan(
      { name: 'OrderController#create', op: 'controller' },
      async () => {
        const output = await this.createOrder.execute({
          recordId: request.recordId,
          quantity: request.quantity,
        });

        return OrderPresenter.fromOutput(output);
      },
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: OrdersPaginatedPresenter,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ): Promise<OrdersPaginatedPresenter> {
    return Sentry.startSpan(
      { name: 'OrderController#findAll', op: 'controller' },
      async () => {
        const output = await this.listOrders.execute(page, pageSize);
        return OrdersPaginatedPresenter.fromOutput(output);
      },
    );
  }
}
