import { CreateOrderUseCase } from '@/contexts/orders/application/create-order.usecase';
import { ListOrdersUseCase } from '@/contexts/orders/application/list-orders.usecase';
import { OrderOutput } from '@/contexts/orders/application/outputs/order.output';
import { OrdersPageOutput } from '@/contexts/orders/application/outputs/orders-page.output';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import * as Sentry from '@sentry/nestjs';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order successfully created',
    type: OrderOutput,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  async create(@Body() request: CreateOrderRequestDTO): Promise<OrderOutput> {
    return Sentry.startSpan(
      { name: 'OrderController#create', op: 'controller' },
      async () => {
        return this.createOrder.execute({
          recordId: request.recordId,
          quantity: request.quantity,
        });
      },
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ): Promise<OrdersPageOutput> {
    return Sentry.startSpan(
      { name: 'OrderController#findAll', op: 'controller' },
      async () => {
        return this.listOrders.execute(page, pageSize);
      },
    );
  }
}
