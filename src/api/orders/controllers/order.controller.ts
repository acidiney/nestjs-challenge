import { CreateOrderUseCase } from '@/contexts/orders/application/create-order.usecase';
import { OrderOutput } from '@/contexts/orders/application/outputs/order.output';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly createOrder: CreateOrderUseCase) {}

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
    return this.createOrder.execute({
      recordId: request.recordId,
      quantity: request.quantity,
    });
  }
}
