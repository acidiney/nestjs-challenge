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
import * as Sentry from '@sentry/nestjs';
import { Order } from '../schemas/order.schema';

export class MongoOrdersRepository implements OrdersRepository {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(dto: CreateOrderInput): Promise<OrderModel> {
    return Sentry.startSpan(
      { name: 'MongoOrdersRepository#create', op: 'db' },
      async () => {
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

        const recordTitle = `${existing.artist} - ${existing.album}`;

        const created = await this.orderModel.create({
          recordId: new Types.ObjectId(recordId) as any,
          recordTitle,
          quantity,
          unitPrice,
          totalPrice,
        });

        return {
          id: created._id.toString(),
          recordId: created.recordId.toString() as any,
          recordTitle: created.recordTitle,
          quantity: created.quantity,
          unitPrice: created.unitPrice,
          totalPrice: created.totalPrice,
          created: (created as any).createdAt,
        };
      },
    );
  }

  async updateById(id: string, dto: Partial<Order>): Promise<Order> {
    return Sentry.startSpan(
      { name: 'MongoOrdersRepository#updateById', op: 'db' },
      async () => {
        const updated = await this.orderModel.findByIdAndUpdate(id, dto, {
          new: true,
        });

        if (!updated) {
          throw new NotFoundException('Order not found');
        }

        return updated;
      },
    );
  }

  async findAll(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<OrderModel[]> {
    return Sentry.startSpan(
      { name: 'MongoOrdersRepository#findAll', op: 'db' },
      async () => {
        const p = page > 0 ? page : 1;
        const ps = pageSize > 0 ? pageSize : 20;
        const results = await this.orderModel
          .find()
          .sort({ createdAt: -1 })
          .skip((p - 1) * ps)
          .limit(ps)
          .lean()
          .exec();
        return results.map((o: any) => ({
          id: o._id.toString(),
          recordId: o.recordId,
          recordTitle: o.recordTitle,
          quantity: o.quantity,
          unitPrice: o.unitPrice,
          totalPrice: o.totalPrice,
          created: o.createdAt,
        }));
      },
    );
  }

  async count(): Promise<number> {
    return Sentry.startSpan(
      { name: 'MongoOrdersRepository#count', op: 'db' },
      async () => {
        return this.orderModel.countDocuments({}).exec();
      },
    );
  }
}
