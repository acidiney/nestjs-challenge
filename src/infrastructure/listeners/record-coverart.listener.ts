import {
  MUSIC_METADATA_SERVICE,
  MusicMetadataService,
} from '@/contexts/records/application/services/music-metadata.service';
import { MBID } from '@/contexts/records/domain/value-objects/mbid.vo';
import { RecordDocument } from '@/contexts/records/infrastructure/persistence/mongoose/schemas/record.schema';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import * as Sentry from '@sentry/nestjs';
import { Model } from 'mongoose';

type CoverArtEventPayload = {
  id: string;
  mbid?: string;
};

@Injectable()
export class RecordCoverArtListener {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<RecordDocument>,
    @Inject(MUSIC_METADATA_SERVICE)
    private readonly metadata: MusicMetadataService,
  ) {}

  @OnEvent('records.coverart.fetch', { async: true, nextTick: true })
  async onFetchCoverArt(payload: CoverArtEventPayload): Promise<void> {
    return Sentry.startSpan(
      { name: 'RecordCoverArtListener#onFetchCoverArt', op: 'listener' },
      async () => {
        const id = payload?.id;
        if (!id) return;

        const mbidStr = payload?.mbid?.trim();

        const url = await this.metadata.fetchCoverImageByMbid(
          MBID.from(mbidStr),
        );

        if (!url) return;

        await this.recordModel
          .updateOne({ _id: id }, { $set: { coverImage: url } })
          .exec();
      },
    );
  }
}
