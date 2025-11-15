import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import * as request from 'supertest';

import { AppModule } from '@/app.module';

import { RecordCategory } from '@/contexts/records/domain/enums/record-category.enum';
import { RecordFormat } from '@/contexts/records/domain/enums/record-format.enum';
import { Record } from '@/contexts/records/infrastructure/persistence/mongoose/schemas/record.schema';

describe('GET /records (findAll) - e2e', () => {
  let app: INestApplication;
  let recordModel: Model<Record>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    recordModel = app.get<Model<Record>>(getModelToken('Record'));
  });

  afterAll(async () => {
    for (const id of createdIds) {
      try {
        await recordModel.findByIdAndDelete(id).exec();
      } catch {}
    }
    await app.close();
  });

  it('returns 200 and an array', async () => {
    const res = await request(app.getHttpServer()).get('/records').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('includes newly created records', async () => {
    const recordA = {
      artist: 'E2E Artist A',
      album: 'E2E Album A',
      price: 15,
      qty: 5,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };
    const recordB = {
      artist: 'E2E Artist B',
      album: 'E2E Album B',
      price: 20,
      qty: 8,
      format: RecordFormat.CD,
      category: RecordCategory.JAZZ,
    };

    const createA = await request(app.getHttpServer())
      .post('/records')
      .send(recordA)
      .expect(201);
    createdIds.push(createA.body._id);

    const createB = await request(app.getHttpServer())
      .post('/records')
      .send(recordB)
      .expect(201);
    createdIds.push(createB.body._id);

    const res = await request(app.getHttpServer()).get('/records').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    const hasA = res.body.some((r: any) => r.artist === 'E2E Artist A');
    const hasB = res.body.some((r: any) => r.artist === 'E2E Artist B');
    expect(hasA).toBe(true);
    expect(hasB).toBe(true);
  });

  it('still returns 200 with query params and includes matching records', async () => {
    const res = await request(app.getHttpServer())
      .get('/records?artist=E2E%20Artist%20A')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    const hasA = res.body.some((r: any) => r.artist === 'E2E Artist A');
    expect(hasA).toBe(true);
  });
});
