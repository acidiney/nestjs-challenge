import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RECORDS_READ_REPOSITORY,
  RecordsReadRepository,
} from '../domain/repositories/records-read.repository';
import {
  RECORDS_REPOSITORY,
  RecordsRepository,
} from '../domain/repositories/records.repository';
import { Tracklist } from '../domain/types/tracklist.type';
import { CreateRecordInput } from './inputs/create-record.input';
import { RecordOutput } from './outputs/record.output';
import {
  MUSIC_METADATA_SERVICE,
  MusicMetadataService,
} from './services/music-metadata.service';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class CreateRecordUseCase {
  constructor(
    @Inject(RECORDS_REPOSITORY)
    private readonly repo: RecordsRepository,
    @Inject(RECORDS_READ_REPOSITORY)
    private readonly readRepo: RecordsReadRepository,
    @Inject(MUSIC_METADATA_SERVICE)
    private readonly metadata: MusicMetadataService,
    private readonly events: EventEmitter2 = new EventEmitter2(),
  ) {}

  async execute(dto: CreateRecordInput): Promise<RecordOutput> {
    return Sentry.startSpan(
      { name: 'CreateRecordUseCase#execute', op: 'usecase' },
      async () => {
        const existing = await this.readRepo.findByUnique(
          dto.artist,
          dto.album,
          dto.format,
        );

        if (existing) {
          throw new ConflictException('Record already exists');
        }

        let tracklist: Tracklist[] | undefined;

        if (dto.mbid) {
          tracklist = await this.metadata.fetchTrackInfosByMbid(dto.mbid);
        }

        const created = await this.repo.create({ ...dto, tracklist });
        this.events.emit('cache.invalidate', 'record:list');
        return RecordOutput.fromModel(created);
      },
    );
  }
}
