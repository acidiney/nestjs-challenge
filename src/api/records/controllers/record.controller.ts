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
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';

import { CreateRecordUseCase } from '@/contexts/records/application/create-record.usecase';
import { CreateRecordInput } from '@/contexts/records/application/inputs/create-record.input';
import { UpdateRecordInput } from '@/contexts/records/application/inputs/update-record.input';
import { ListRecordsUseCase } from '@/contexts/records/application/list-records.usecase';
import { RecordOutput } from '@/contexts/records/application/outputs/record.output';
import { RecordsPageOutput } from '@/contexts/records/application/outputs/records-page.output';
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
import { LookupMbidRequestDTO } from '../dtos/lookup-mbid.request.dto';
import * as Sentry from '@sentry/nestjs';

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
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Record already exists' })
  async create(@Body() request: CreateRecordRequestDTO): Promise<RecordOutput> {
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
        return this.createRecord.execute(input);
      },
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 500, description: 'Cannot find record to update' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<RecordOutput> {
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
        return this.updateRecord.execute(id, input);
      },
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
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
  ): Promise<RecordsPageOutput> {
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

        return this.listRecords.execute(request);
      },
    );
  }

  @Post('mbid/search')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lookup MBID by artist and album' })
  @ApiResponse({ status: 200, description: 'MBID found or not' })
  async searchMbid(
    @Body() body: LookupMbidRequestDTO,
  ): Promise<{ mbid: string | null }> {
    return Sentry.startSpan(
      { name: 'RecordController#searchMbid', op: 'controller' },
      async () => {
        const mbid = await this.metadata.searchReleaseMbid(
          body.artist,
          body.album,
        );
        return { mbid: mbid ? mbid.toString() : null };
      },
    );
  }
}
