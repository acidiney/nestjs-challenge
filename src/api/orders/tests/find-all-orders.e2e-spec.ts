import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import { RecordCategory } from '@/contexts/records/domain/enums/record-category.enum';
import { RecordFormat } from '@/contexts/records/domain/enums/record-format.enum';

describe('GET /orders (findAll) - e2e', () => {
  let app: INestApplication;
  let recordModel: any;
  let orderModel: any;
  const createdRecordIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    recordModel = app.get('RecordModel');
    orderModel = app.get('OrderModel');
  });

  afterAll(async () => {
    for (const id of createdRecordIds) {
      try {
        await recordModel.findByIdAndDelete(id).exec();
      } catch {}
    }
    try {
      await orderModel.deleteMany({}).exec();
    } catch {}
    await app.close();
  });

  it('returns 200 and paginated payload', async () => {
    const res = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        page: expect.any(Number),
        perPage: expect.any(Number),
        total: expect.any(Number),
        data: expect.any(Array),
      }),
    );
  });

  it('includes newly created orders', async () => {
    const rec = await request(app.getHttpServer())
      .post('/records')
      .send({
        artist: 'E2E Orders List Artist',
        album: 'E2E Orders List Album',
        price: 12,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      })
      .expect(201);

    const recordId: string = rec.body.id;
    createdRecordIds.push(recordId);

    const o1 = await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId, quantity: 2 })
      .expect(201);

    const o2 = await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId, quantity: 3 })
      .expect(201);

    expect(o1.body).toEqual(
      expect.objectContaining({
        recordId,
        quantity: 2,
        unitPrice: 12,
        totalPrice: 24,
      }),
    );
    expect(o2.body).toEqual(
      expect.objectContaining({
        recordId,
        quantity: 3,
        unitPrice: 12,
        totalPrice: 36,
      }),
    );

    const res = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const hasOrderForRecord = res.body.data.some(
      (o: any) => o.recordId === recordId,
    );
    expect(hasOrderForRecord).toBe(true);
  });
});
