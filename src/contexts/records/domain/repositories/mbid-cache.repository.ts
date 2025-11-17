import { Tracklist } from '../types/tracklist.type';

export interface MbidCacheRepository {
  findTracklist(mbid: string): Promise<Tracklist[] | null>;
  upsertTracklist(
    mbid: string,
    tracklist: Tracklist[],
    ttlDays: number,
  ): Promise<void>;
  findReleaseMbid(artist: string, album: string): Promise<string | null>;
  upsertReleaseMbid(
    artist: string,
    album: string,
    mbid: string,
    ttlDays: number,
  ): Promise<void>;
}

export const MBID_CACHE_REPOSITORY = Symbol('MBID_CACHE_REPOSITORY');
