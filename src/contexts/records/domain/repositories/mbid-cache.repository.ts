export interface MbidCacheRepository {
  findTracklist(mbid: string): Promise<string[] | null>;
  upsertTracklist(
    mbid: string,
    tracklist: string[],
    ttlDays: number,
  ): Promise<void>;
}

export const MBID_CACHE_REPOSITORY = Symbol('MBID_CACHE_REPOSITORY');
