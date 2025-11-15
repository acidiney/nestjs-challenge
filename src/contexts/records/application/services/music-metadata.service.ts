import { InjectionToken } from '@nestjs/common';
import { MBID } from '../../domain/value-objects/mbid.vo';

export interface MusicMetadataService {
  fetchTracklistByMbid(mbid: MBID): Promise<string[]>;
}

export const MUSIC_METADATA_SERVICE: InjectionToken = Symbol(
  'MUSIC_METADATA_SERVICE',
);
