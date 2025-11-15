import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateRecordUseCase } from '../../contexts/records/application/create-record.usecase';
import { ListRecordsUseCase } from '../../contexts/records/application/list-records.usecase';
import { UpdateRecordUseCase } from '../../contexts/records/application/update-record.usecase';
import { ListRecordsQuery } from '../../contexts/records/domain/queries/list-records.query';
import { RecordSortParam } from '../../contexts/records/domain/queries/sort.types';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { Record } from '../schemas/record.schema';

@Controller('records')
export class RecordController {
  constructor(
    private readonly createRecord: CreateRecordUseCase,
    private readonly updateRecord: UpdateRecordUseCase,
    private readonly listRecords: ListRecordsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateRecordRequestDTO): Promise<Record> {
    return this.createRecord.execute(request);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 500, description: 'Cannot find record to update' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    return this.updateRecord.execute(id, updateRecordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [Record],
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Search query (search across multiple fields like artist, album, category, etc.)',
    type: String,
  })
  @ApiQuery({
    name: 'artist',
    required: false,
    description: 'Filter by artist name',
    type: String,
  })
  @ApiQuery({
    name: 'album',
    required: false,
    description: 'Filter by album name',
    type: String,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Filter by record format (Vinyl, CD, etc.)',
    enum: RecordFormat,
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by record category (e.g., Rock, Jazz)',
    enum: RecordCategory,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Page size for pagination (default: 20)',
    type: Number,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort by: relevance (text search), price, or created',
    enum: ['relevance', 'price', 'created'],
  })
  async findAll(
    @Query('q') q?: string,
    @Query('artist') artist?: string,
    @Query('album') album?: string,
    @Query('format') format?: RecordFormat,
    @Query('category') category?: RecordCategory,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('sort') sort: RecordSortParam = 'relevance',
  ): Promise<Record[]> {
    const terms: string[] = [];
    if (q) terms.push(q);
    if (artist) terms.push(artist);
    if (album) terms.push(album);

    const request: ListRecordsQuery = {
      search: terms.length ? terms.join(' ') : undefined,
      category,
      format,
      sort,
      page,
      pageSize,
    };

    return this.listRecords.execute(request);
  }
}
