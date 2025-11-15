import { CreateOrderInput } from '@/contexts/orders/application/inputs/create-order.input';
import { OrderModel } from '@/contexts/orders/domain/models/order.model';
import { OrdersRepository } from '@/contexts/orders/domain/repositories/orders.repository';
import { Record } from '@/contexts/records/infrastructure/persistence/mongoose/schemas/record.schema';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../schemas/order.schema';

export class MongoOrdersRepository implements OrdersRepository {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(dto: CreateOrderInput): Promise<OrderModel> {
    const recordId = dto.recordId as unknown as string;
    const quantity = dto.quantity as number;

    if (!recordId || !quantity) {
      throw new BadRequestException('recordId and quantity are required');
    }

    if (quantity <= 0) {
      throw new BadRequestException('quantity must be greater than 0');
    }

    const existing = await this.recordModel.findById(recordId).lean();
    if (!existing) {
      throw new NotFoundException('Record not found');
    }

    const updated = await this.recordModel
      .findOneAndUpdate(
        { _id: recordId as any, qty: { $gte: quantity } },
        { $inc: { qty: -quantity } },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new ConflictException('Insufficient stock');
    }

    const unitPrice = existing.price;
    const totalPrice = unitPrice * quantity;

    return {
      id: new Types.ObjectId().toString(),
      recordId: new Types.ObjectId(recordId) as any,
      quantity,
      unitPrice,
      totalPrice,
    };
  }

  async updateById(id: string, dto: Partial<Order>): Promise<Order> {
    const updated = await this.orderModel.findByIdAndUpdate(id, dto, {
      new: true,
    });

    if (!updated) {
      throw new NotFoundException('Order not found');
    }

    return updated;
  }
}
