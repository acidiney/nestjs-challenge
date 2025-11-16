import { InjectionToken } from '@nestjs/common';
import { Tracklist } from '../../domain/types/tracklist.type';
import { MBID } from '../../domain/value-objects/mbid.vo';

export interface MusicMetadataService {
  fetchTrackInfosByMbid(mbid: MBID): Promise<Tracklist[]>;
}

export const MUSIC_METADATA_SERVICE: InjectionToken = Symbol(
  'MUSIC_METADATA_SERVICE',
);
