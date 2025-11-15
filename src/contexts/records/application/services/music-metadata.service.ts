import { InjectionToken } from '@nestjs/common';

export interface MusicMetadataService {
  fetchTracklistByMbid(mbid: string): Promise<string[]>;
}

export const MUSIC_METADATA_SERVICE: InjectionToken = Symbol(
  'MUSIC_METADATA_SERVICE',
);
