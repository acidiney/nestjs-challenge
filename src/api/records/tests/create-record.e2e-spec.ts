import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import { MUSIC_METADATA_SERVICE } from '@/contexts/records/application/services/music-metadata.service';
import { RecordCategory } from '@/contexts/records/domain/enums/record-category.enum';
import { RecordFormat } from '@/contexts/records/domain/enums/record-format.enum';
import { Tracklist } from '@/contexts/records/domain/types/tracklist.type';

describe('RecordController (e2e)', () => {
  let app: INestApplication;
  let recordId: string;
  let recordModel;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    recordModel = app.get('RecordModel');
    await app.init();
  });

  // Test to create a record
  it('should create a new record', async () => {
    const createRecordDto = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const response = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = response.body._id;
    expect(response.body).toHaveProperty('artist', 'The Beatles');
    expect(response.body).toHaveProperty('album', 'Abbey Road');
  });

  it('should create a new record and fetch it with filters', async () => {
    const createRecordDto = {
      artist: 'The Fake Band',
      album: 'Fake Album',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = createResponse.body._id;

    const response = await request(app.getHttpServer())
      .get('/records?artist=The Fake Band')
      .expect(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0]).toHaveProperty('artist', 'The Fake Band');
  });

  it('should not create duplicate record entries', async () => {
    const createRecordDto = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const firstResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = firstResponse.body.id;

    await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(409);

    const listResponse = await request(app.getHttpServer())
      .get('/records?q=The Beatles&album=Abbey Road&format=Vinyl')
      .expect(200);

    expect(Array.isArray(listResponse.body.data)).toBe(true);
    expect(listResponse.body.total).toBe(1);
  });

  describe('Create with MBID (metadata integration)', () => {
    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(MUSIC_METADATA_SERVICE)
        .useValue({
          fetchTrackInfosByMbid: async () =>
            [
              {
                title: 'Track 1',
                length: '3:30',
                releaseDate: '2023-01-01',
                hasVideo: false,
              },
              {
                title: 'Track 2',
                length: '4:00',
                releaseDate: '2023-01-02',
                hasVideo: true,
              },
            ] as Tracklist[],
        })
        .compile();

      app = moduleFixture.createNestApplication();

      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
        }),
      );
      recordModel = app.get('RecordModel');
      await app.init();
    });

    it('populates tracklist when valid mbid is provided', async () => {
      const createRecordDto = {
        artist: 'MBID Artist',
        album: 'MBID Album',
        price: 30,
        qty: 5,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
      };

      const res = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);

      recordId = res.body._id;
      expect(Array.isArray(res.body.tracklist)).toBe(true);
      expect(res.body.tracklist).toEqual([
        {
          title: 'Track 1',
          length: '3:30',
          releaseDate: '2023-01-01',
          hasVideo: false,
        },
        {
          title: 'Track 2',
          length: '4:00',
          releaseDate: '2023-01-02',
          hasVideo: true,
        },
      ]);
    });

    it('returns 400 for invalid mbid format and does not create', async () => {
      const createRecordDto = {
        artist: 'Bad MBID Artist',
        album: 'Bad MBID Album',
        price: 10,
        qty: 1,
        format: RecordFormat.CD,
        category: RecordCategory.POP,
        mbid: 'invalid-mbid-format',
      } as any;

      await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(400);
    });
  });
  afterEach(async () => {
    if (recordId) {
      await recordModel.findByIdAndDelete(recordId);
    }
  });

  afterAll(async () => {
    await app.close();
  });
});
