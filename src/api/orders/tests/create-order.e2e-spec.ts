import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import { RecordCategory } from '@/contexts/records/domain/enums/record-category.enum';
import { RecordFormat } from '@/contexts/records/domain/enums/record-format.enum';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let recordModel: any;
  let orderModel: any;
  let recordId: string | undefined;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    recordModel = app.get('RecordModel');
    orderModel = app.get('OrderModel');
  });

  it('returns 400 when required fields are missing', async () => {
    await request(app.getHttpServer()).post('/orders').send({}).expect(400);
  });

  it('returns 400 when quantity <= 0', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId: '123', quantity: 0 })
      .expect(400);
  });

  it('returns 404 when record does not exist', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId: '5f8f8c44b54764421b7156c1', quantity: 1 })
      .expect(404);
  });

  it('returns 409 when insufficient stock', async () => {
    const createRecordDto = {
      artist: 'E2E Insufficient Artist',
      album: 'E2E Insufficient Album',
      price: 15,
      qty: 1,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };
    const rec = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);
    recordId = rec.body.id;

    await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId, quantity: 2 })
      .expect(409);
  });

  it('creates order and decrements stock', async () => {
    const createRecordDto = {
      artist: 'E2E Order Artist',
      album: 'E2E Order Album',
      price: 20,
      qty: 5,
      format: RecordFormat.CD,
      category: RecordCategory.POP,
    };
    const rec = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = rec.body.id;

    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId, quantity: 3 })
      .expect(201);

    expect(orderRes.body).toHaveProperty('recordId');
    expect(orderRes.body).toHaveProperty('quantity', 3);
    expect(orderRes.body).toHaveProperty('unitPrice', 20);
    expect(orderRes.body).toHaveProperty('totalPrice', 60);

    const updatedRecord = await recordModel.findById(recordId).lean();
    expect(updatedRecord.qty).toBe(2);
  });

  afterEach(async () => {
    if (recordId) {
      await recordModel.findByIdAndDelete(recordId);
    }
    if (orderModel) {
      await orderModel.deleteMany({});
    }
    await app.close();
  });
});
