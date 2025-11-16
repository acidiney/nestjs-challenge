import { ListOrdersUseCase } from './list-orders.usecase';

describe('ListOrdersUseCase', () => {
  it('returns paginated outputs from repository results', async () => {
    const repo = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'o1',
          recordId: 'r1',
          quantity: 2,
          unitPrice: 10,
          totalPrice: 20,
        },
      ]),
      count: jest.fn().mockResolvedValue(1),
    } as any;

    const usecase = new ListOrdersUseCase(repo);
    const payload = await usecase.execute(1, 20);

    expect(repo.findAll).toHaveBeenCalledWith(1, 20);
    expect(repo.count).toHaveBeenCalled();
    expect(payload).toMatchObject({ page: 1, perPage: 20, total: 1 });
    expect(payload.data[0]).toMatchObject({ id: 'o1', totalPrice: 20 });
  });
});
