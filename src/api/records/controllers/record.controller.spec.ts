import { CacheModule } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { RecordPresenter } from './../presenters/record.presenter';

import { CreateRecordUseCase } from '@/contexts/records/application/create-record.usecase';
import { ListRecordsUseCase } from '@/contexts/records/application/list-records.usecase';
import { MUSIC_METADATA_SERVICE } from '@/contexts/records/application/services/music-metadata.service';
import { UpdateRecordUseCase } from '@/contexts/records/application/update-record.usecase';
import { RecordCategory } from '@/contexts/records/domain/enums/record-category.enum';
import { RecordFormat } from '@/contexts/records/domain/enums/record-format.enum';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordsPaginatedPresenter } from '../presenters/records-paginated.presenter';
import { RecordController } from './record.controller';

describe('RecordController', () => {
  let recordController: RecordController;
  let createRecord: { execute: jest.Mock };
  let updateRecord: { execute: jest.Mock };
  let listRecords: { execute: jest.Mock };

  beforeEach(async () => {
    createRecord = { execute: jest.fn() };
    updateRecord = { execute: jest.fn() };
    listRecords = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [RecordController],
      providers: [
        { provide: CreateRecordUseCase, useValue: createRecord },
        { provide: UpdateRecordUseCase, useValue: updateRecord },
        { provide: ListRecordsUseCase, useValue: listRecords },
        {
          provide: MUSIC_METADATA_SERVICE,
          useValue: {
            searchReleaseMbid: jest.fn(),
            fetchTrackInfosByMbid: jest.fn(),
          },
        },
      ],
    }).compile();

    recordController = module.get<RecordController>(RecordController);
  });

  it('should create a new record', async () => {
    const createRecordDto: CreateRecordRequestDTO = {
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
    };

    const savedRecord = RecordPresenter.fromOutput({
      id: '1',
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
    });
    createRecord.execute.mockResolvedValue(savedRecord);

    const result = await recordController.create(createRecordDto);
    expect(result).toEqual(savedRecord);
    expect(createRecord.execute).toHaveBeenCalledWith({
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      category: RecordCategory.ALTERNATIVE,
      format: RecordFormat.VINYL,
    });
  });

  it('should return paginated records', async () => {
    const payload = {
      page: 1,
      totalRecords: 2,
      perPage: 20,
      data: [
        { id: '1', artist: 'A', album: 'R1', price: 100, qty: 10 },
        { id: '2', artist: 'B', album: 'R2', price: 200, qty: 20 },
      ],
    } as any;
    listRecords.execute.mockResolvedValue(payload);

    const result = await recordController.findAll();
    expect(result).toEqual(RecordsPaginatedPresenter.fromOutput(payload));
    expect(listRecords.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 20, sort: 'relevance' }),
    );
  });
});
