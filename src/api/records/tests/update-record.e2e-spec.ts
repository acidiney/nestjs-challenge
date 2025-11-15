import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import { MUSIC_METADATA_SERVICE } from '@/contexts/records/application/services/music-metadata.service';
import { RecordCategory } from '@/contexts/records/domain/enums/record-category.enum';
import { RecordFormat } from '@/contexts/records/domain/enums/record-format.enum';

describe('RecordController update (e2e)', () => {
  let app: INestApplication;
  let recordId: string | undefined;
  let recordModel: any;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    recordModel = app.get('RecordModel');
    await app.init();
  });

  it('updates an existing record by id', async () => {
    const createRecordDto = {
      artist: 'Update Artist',
      album: 'Update Album',
      price: 20,
      qty: 2,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const createRes = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = createRes.body.id;

    const updateDto = {
      price: 30,
      qty: 3,
    };

    const updateRes = await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send(updateDto)
      .expect(200);

    expect(updateRes.body).toHaveProperty('id', recordId);
    expect(updateRes.body).toHaveProperty('price', 30);
    expect(updateRes.body).toHaveProperty('qty', 3);
    expect(updateRes.body).toHaveProperty('artist', 'Update Artist');
    expect(updateRes.body).toHaveProperty('album', 'Update Album');
  });

  describe('Update with MBID (metadata refresh)', () => {
    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(MUSIC_METADATA_SERVICE)
        .useValue({
          fetchTracklistByMbid: async () => [
            'Refreshed Track 1',
            'Refreshed Track 2',
          ],
        })
        .compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
        }),
      );
      recordModel = app.get('RecordModel');
      await app.init();
    });

    it('updates mbid and refreshes tracklist', async () => {
      const createRecordDto = {
        artist: 'MBID Update Artist',
        album: 'MBID Update Album',
        price: 40,
        qty: 1,
        format: RecordFormat.CD,
        category: RecordCategory.POP,
        mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
      };

      const createRes = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);

      recordId = createRes.body.id;

      const newMbid = '5b11f4ce-a62d-471e-81fc-a69a8278c7da';
      const updateDto = {
        mbid: newMbid,
      };

      const updateRes = await request(app.getHttpServer())
        .put(`/records/${recordId}`)
        .send(updateDto)
        .expect(200);

      expect(updateRes.body).toHaveProperty('id', recordId);
      expect(Array.isArray(updateRes.body.tracklist)).toBe(true);
      expect(updateRes.body.tracklist).toEqual([
        'Refreshed Track 1',
        'Refreshed Track 2',
      ]);
      expect(updateRes.body.mbid).toBe(newMbid);
    });

    it('rejects invalid mbid format on update', async () => {
      const createRecordDto = {
        artist: 'Artist MBID Invalid',
        album: 'Album MBID Invalid',
        price: 20,
        qty: 2,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
      };

      const createRes = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);

      recordId = createRes.body.id ?? createRes.body._id;

      const updateDto = { mbid: 'invalid-mbid-format' } as any;

      await request(app.getHttpServer())
        .put(`/records/${recordId}`)
        .send(updateDto)
        .expect(400);
    });
  });

  it('rejects invalid price and qty on update', async () => {
    const createRecordDto = {
      artist: 'Validation Artist',
      album: 'Validation Album',
      price: 20,
      qty: 2,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const createRes = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = createRes.body.id ?? createRes.body._id;

    await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send({ price: -5 })
      .expect(400);

    await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send({ qty: 1000 })
      .expect(400);
  });

  it('rejects invalid enum values on update', async () => {
    const createRecordDto = {
      artist: 'Enum Artist',
      album: 'Enum Album',
      price: 20,
      qty: 2,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const createRes = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = createRes.body.id ?? createRes.body._id;

    await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send({ format: 'BadFormat' })
      .expect(400);

    await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send({ category: 'BadCategory' })
      .expect(400);
  });

  afterEach(async () => {
    if (recordId) {
      await recordModel.findByIdAndDelete(recordId);
      recordId = undefined;
    }
  });

  afterAll(async () => {
    await app.close();
  });
});
