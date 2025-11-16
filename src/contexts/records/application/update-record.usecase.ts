import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RECORDS_READ_REPOSITORY,
  RecordsReadRepository,
} from '../domain/repositories/records-read.repository';
import {
  RECORDS_REPOSITORY,
  RecordsRepository,
} from '../domain/repositories/records.repository';
import { UpdateRecordInput } from './inputs/update-record.input';
import { RecordOutput } from './outputs/record.output';
import {
  MUSIC_METADATA_SERVICE,
  MusicMetadataService,
} from './services/music-metadata.service';

@Injectable()
export class UpdateRecordUseCase {
  constructor(
    @Inject(RECORDS_REPOSITORY)
    private readonly repo: RecordsRepository,
    @Inject(RECORDS_READ_REPOSITORY)
    private readonly recordReadRepository: RecordsReadRepository,
    @Inject(MUSIC_METADATA_SERVICE)
    private readonly metadata: MusicMetadataService,
    private readonly events: EventEmitter2 = new EventEmitter2(),
  ) {}

  async execute(id: string, dto: UpdateRecordInput): Promise<RecordOutput> {
    const record = await this.recordReadRepository.findById(id);

    if (!record) {
      throw new InternalServerErrorException('Record not found');
    }

    let tracklist = record.tracklist;

    if (dto.mbid && !dto.mbid?.equals(record.mbid)) {
      tracklist = await this.metadata.fetchTrackInfosByMbid(dto.mbid);
    }

    const updatedDto = Object.assign(record, dto, {
      tracklist,
    });

    await this.repo.updateById(id, updatedDto);
    this.events.emit('cache.invalidate', 'record:list');
    return RecordOutput.fromModel(await this.recordReadRepository.findById(id));
  }
}
