import { MongoOrdersRepository } from './mongo-orders.repository';

describe('MongoOrdersRepository', () => {
  const makeModels = () => ({
    orderModel: { create: jest.fn() },
    recordModel: {
      findById: jest.fn().mockReturnValue({ lean: jest.fn() }),
      findOneAndUpdate: jest.fn().mockReturnValue({ lean: jest.fn() }),
    },
  });

  it('throws BadRequest when payload missing', async () => {
    const m = makeModels();
    const repo = new MongoOrdersRepository(
      m.orderModel as any,
      m.recordModel as any,
    );
    await expect(repo.create({} as any)).rejects.toMatchObject({ status: 400 });
    await expect(
      repo.create({ recordId: 'r1', quantity: 0 } as any),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws NotFound when record missing', async () => {
    const m = makeModels();
    (m.recordModel.findById().lean as any).mockResolvedValue(null);
    const repo = new MongoOrdersRepository(
      m.orderModel as any,
      m.recordModel as any,
    );
    await expect(
      repo.create({ recordId: 'r1', quantity: 1 }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws Conflict when insufficient stock', async () => {
    const m = makeModels();
    (m.recordModel.findById().lean as any).mockResolvedValue({ price: 10 });
    (m.recordModel.findOneAndUpdate().lean as any).mockResolvedValue(null);
    const repo = new MongoOrdersRepository(
      m.orderModel as any,
      m.recordModel as any,
    );
    await expect(
      repo.create({ recordId: 'r1', quantity: 5 }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('returns created order on success and decrements', async () => {
    const m = makeModels();
    (m.recordModel.findById().lean as any).mockResolvedValue({ price: 20 });
    (m.recordModel.findOneAndUpdate().lean as any).mockResolvedValue({
      _id: 'r1',
      qty: 2,
    });
    const repo = new MongoOrdersRepository(
      m.orderModel as any,
      m.recordModel as any,
    );
    const res = await repo.create({
      recordId: '000000000000000000000001',
      quantity: 2,
    });
    expect(res).toMatchObject({ quantity: 2, unitPrice: 20, totalPrice: 40 });
  });

  it('updateById returns updated or throws NotFound', async () => {
    const orderModel = {
      findByIdAndUpdate: jest
        .fn()
        .mockResolvedValue({ _id: 'o1', quantity: 1 }),
    } as any;
    const repo = new MongoOrdersRepository(orderModel, {} as any);
    const updated = await repo.updateById('o1', { quantity: 2 });
    expect(updated).toMatchObject({ _id: 'o1' });

    orderModel.findByIdAndUpdate.mockResolvedValue(null);
    await expect(repo.updateById('o1', { quantity: 3 })).rejects.toMatchObject({
      status: 404,
    });
  });
});
