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

  it('returns 200 and paginated payload', async () => {
    const res = await request(app.getHttpServer()).get('/records').expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        page: expect.any(Number),
        perPage: expect.any(Number),
        total: expect.any(Number),
        data: expect.any(Array),
      }),
    );
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
    expect(Array.isArray(res.body.data)).toBe(true);
    const hasA = res.body.data.some((r: any) => r.artist === 'E2E Artist A');
    const hasB = res.body.data.some((r: any) => r.artist === 'E2E Artist B');
    expect(hasA).toBe(true);
    expect(hasB).toBe(true);
  });

  it('still returns 200 with query params and includes matching records', async () => {
    const recordA = {
      artist: 'E2E Artist A',
      album: 'E2E Album A',
      price: 15,
      qty: 5,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };
    await request(app.getHttpServer())
      .post('/records')
      .send(recordA)
      .expect(201);
    const res = await request(app.getHttpServer())
      .get('/records?artist=E2E%20Artist%20A')
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const hasA = res.body.data.some((r: any) => r.artist === 'E2E Artist A');
    expect(hasA).toBe(true);
  });

  it('sorts by price ascending when sort=price', async () => {
    const base = {
      qty: 1,
      format: RecordFormat.VINYL,
      category: RecordCategory.INDIE,
    };

    const a = { artist: 'E2E SortPrice A', album: 'SP A', price: 10, ...base };
    const b = { artist: 'E2E SortPrice B', album: 'SP B', price: 30, ...base };
    const c = { artist: 'E2E SortPrice C', album: 'SP C', price: 20, ...base };

    const createA = await request(app.getHttpServer())
      .post('/records')
      .send(a)
      .expect(201);
    createdIds.push(createA.body._id);

    const createB = await request(app.getHttpServer())
      .post('/records')
      .send(b)
      .expect(201);
    createdIds.push(createB.body._id);

    const createC = await request(app.getHttpServer())
      .post('/records')
      .send(c)
      .expect(201);
    createdIds.push(createC.body._id);

    const res = await request(app.getHttpServer())
      .get('/records?artist=E2E%20SortPrice&sort=price')
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    const prices = res.body.data.map((r: any) => r.price);
    // Ensure first three are ordered ascending by price for the filtered set
    expect(prices.slice(0, 3)).toEqual([10, 20, 30]);
  });

  it('paginates results with page and pageSize along with sort=artist', async () => {
    const base = {
      album: 'PC',
      price: 15,
      qty: 1,
      format: RecordFormat.CD,
      category: RecordCategory.INDIE,
    };

    const artists = [
      'E2E PaginateCase A',
      'E2E PaginateCase B',
      'E2E PaginateCase C',
      'E2E PaginateCase D',
      'E2E PaginateCase E',
    ];

    for (const artist of artists) {
      const create = await request(app.getHttpServer())
        .post('/records')
        .send({ artist, ...base })
        .expect(201);
      createdIds.push(create.body._id);
    }

    const res = await request(app.getHttpServer())
      .get('/records?artist=E2E%20PaginateCase&sort=artist&page=2&pageSize=2')
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.page).toBe(2);
    expect(res.body.perPage).toBe(2);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].artist).toBe('E2E PaginateCase C');
    expect(res.body.data[1].artist).toBe('E2E PaginateCase D');
  });
});
