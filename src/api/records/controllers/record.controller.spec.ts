import { Test, TestingModule } from '@nestjs/testing';

import { CreateRecordUseCase } from '@/contexts/records/application/create-record.usecase';
import { ListRecordsUseCase } from '@/contexts/records/application/list-records.usecase';
import { UpdateRecordUseCase } from '@/contexts/records/application/update-record.usecase';
import { RecordCategory } from '@/contexts/records/domain/enums/record-category.enum';
import { RecordFormat } from '@/contexts/records/domain/enums/record-format.enum';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
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
      controllers: [RecordController],
      providers: [
        { provide: CreateRecordUseCase, useValue: createRecord },
        { provide: UpdateRecordUseCase, useValue: updateRecord },
        { provide: ListRecordsUseCase, useValue: listRecords },
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

    const savedRecord = {
      _id: '1',
      name: 'Test Record',
      price: 100,
      qty: 10,
    } as any;
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

  it('should return an array of records', async () => {
    const records = [
      { _id: '1', name: 'Record 1', price: 100, qty: 10 },
      { _id: '2', name: 'Record 2', price: 200, qty: 20 },
    ];
    listRecords.execute.mockResolvedValue(records as any);

    const result = await recordController.findAll();
    expect(result).toEqual(records);
    expect(listRecords.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 20, sort: 'relevance' }),
    );
  });
});
