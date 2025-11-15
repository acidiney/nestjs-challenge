import { CreateOrderUseCase } from './create-order.usecase';

describe('CreateOrderUseCase', () => {
  it('delegates to repository to create order', async () => {
    const repo = {
      create: jest.fn().mockResolvedValue({
        id: 'ord_1',
        recordId: 'rec_1',
        quantity: 2,
        unitPrice: 10,
        totalPrice: 20,
      }),
    };

    const usecase = new CreateOrderUseCase(repo as any);
    const result = await usecase.execute({ recordId: 'rec_1', quantity: 2 });

    expect(repo.create).toHaveBeenCalledWith({
      recordId: 'rec_1',
      quantity: 2,
    });
    expect(result).toMatchObject({ id: 'ord_1', totalPrice: 20 });
  });
});
