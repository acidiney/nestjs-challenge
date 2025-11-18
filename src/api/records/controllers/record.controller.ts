import { CacheTTL } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';

import { CreateRecordUseCase } from '@/contexts/records/application/create-record.usecase';
import { CreateRecordInput } from '@/contexts/records/application/inputs/create-record.input';
import { UpdateRecordInput } from '@/contexts/records/application/inputs/update-record.input';
import { ListRecordsUseCase } from '@/contexts/records/application/list-records.usecase';
import {
  MUSIC_METADATA_SERVICE,
  MusicMetadataService,
} from '@/contexts/records/application/services/music-metadata.service';
import { UpdateRecordUseCase } from '@/contexts/records/application/update-record.usecase';
import { RecordCategory } from '@/contexts/records/domain/enums/record-category.enum';
import { RecordFormat } from '@/contexts/records/domain/enums/record-format.enum';
import { ListRecordsQuery } from '@/contexts/records/domain/queries/list-records.query';
import { RecordSortParam } from '@/contexts/records/domain/queries/sort.types';
import { CustomCacheInterceptor } from '@/infrastructure/cache/custom-cache.interceptor';
import * as Sentry from '@sentry/nestjs';
import { LookupMbidRequestDTO } from '../dtos/lookup-mbid.request.dto';
import { RecordPresenter } from '../presenters/record.presenter';
import { RecordsPaginatedPresenter } from '../presenters/records-paginated.presenter';
import { SearchMbidPresenter } from '../presenters/search-mbid.presenter';

@Controller('records')
export class RecordController {
  constructor(
    private readonly createRecord: CreateRecordUseCase,
    private readonly updateRecord: UpdateRecordUseCase,
    private readonly listRecords: ListRecordsUseCase,
    @Inject(MUSIC_METADATA_SERVICE)
    private readonly metadata: MusicMetadataService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiCreatedResponse({
    description: 'Record successfully created',
    type: RecordPresenter,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiConflictResponse({ description: 'Record already exists' })
  async create(
    @Body() request: CreateRecordRequestDTO,
  ): Promise<RecordPresenter> {
    return Sentry.startSpan(
      { name: 'RecordController#create', op: 'controller' },
      async () => {
        const input: CreateRecordInput = {
          artist: request.artist,
          album: request.album,
          price: request.price,
          qty: request.qty,
          format: request.format,
          category: request.category,
          mbid: request.mbid,
        };
        const record = await this.createRecord.execute(input);
        return RecordPresenter.fromOutput(record);
      },
    );
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update an existing record',
    description: 'Update record details by ID',
  })
  @ApiOkResponse({
    description: 'Record updated successfully',
    type: RecordPresenter,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiNotFoundResponse({ description: 'Record not found' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<RecordPresenter> {
    return Sentry.startSpan(
      { name: 'RecordController#update', op: 'controller' },
      async () => {
        const input: UpdateRecordInput = {
          artist: updateRecordDto.artist,
          album: updateRecordDto.album,
          price: updateRecordDto.price,
          qty: updateRecordDto.qty,
          format: updateRecordDto.format,
          category: updateRecordDto.category,
          mbid: updateRecordDto.mbid,
        };
        const record = await this.updateRecord.execute(id, input);
        return RecordPresenter.fromOutput(record);
      },
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiOkResponse({
    description: 'List of records',
    type: () => RecordsPaginatedPresenter,
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
  @UseInterceptors(CustomCacheInterceptor)
  @CacheTTL(300)
  async findAll(
    @Query('q') q?: string,
    @Query('artist') artist?: string,
    @Query('album') album?: string,
    @Query('format') format?: RecordFormat,
    @Query('category') category?: RecordCategory,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('sort') sort: RecordSortParam = 'relevance',
  ): Promise<RecordsPaginatedPresenter> {
    return Sentry.startSpan(
      { name: 'RecordController#findAll', op: 'controller' },
      async () => {
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

        const records = await this.listRecords.execute(request);
        return RecordsPaginatedPresenter.fromOutput(records);
      },
    );
  }

  @Post('mbid/search')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lookup MBID by artist and album' })
  @ApiOkResponse({
    description: 'MBID found or not',
    type: SearchMbidPresenter,
  })
  async searchMbid(
    @Body() body: LookupMbidRequestDTO,
  ): Promise<SearchMbidPresenter> {
    return Sentry.startSpan(
      { name: 'RecordController#searchMbid', op: 'controller' },
      async () => {
        const foundMBID = await this.metadata.searchReleaseMbid(
          body.artist,
          body.album,
        );
        return SearchMbidPresenter.fromOutput(foundMBID);
      },
    );
  }
}
