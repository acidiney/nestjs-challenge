import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  RECORDS_READ_REPOSITORY,
  RecordsReadRepository,
} from '../domain/repositories/records-read.repository';
import {
  RECORDS_REPOSITORY,
  RecordsRepository,
} from '../domain/repositories/records.repository';
import { CreateRecordInput } from './inputs/create-record.input';
import { RecordOutput } from './outputs/record.output';
import {
  MUSIC_METADATA_SERVICE,
  MusicMetadataService,
} from './services/music-metadata.service';

@Injectable()
export class CreateRecordUseCase {
  constructor(
    @Inject(RECORDS_REPOSITORY)
    private readonly repo: RecordsRepository,
    @Inject(RECORDS_READ_REPOSITORY)
    private readonly readRepo: RecordsReadRepository,
    @Inject(MUSIC_METADATA_SERVICE)
    private readonly metadata: MusicMetadataService,
  ) {}

  async execute(dto: CreateRecordInput): Promise<RecordOutput> {
    const existing = await this.readRepo.findByUnique(
      dto.artist,
      dto.album,
      dto.format,
    );

    if (existing) {
      throw new ConflictException('Record already exists');
    }

    let tracklist: string[] | undefined;

    if (dto.mbid) {
      tracklist = await this.metadata.fetchTracklistByMbid(dto.mbid);
    }

    const created = await this.repo.create({ ...dto, tracklist });
    return RecordOutput.fromModel(created);
  }
}
