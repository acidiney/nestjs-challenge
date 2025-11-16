import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheInvalidationListener {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  @OnEvent('cache.invalidate', { async: true })
  async onRecordsChanged(): Promise<void> {
    // TODO: could be improved to invalidate only the keys that match the prefix
    await this.cache.clear();
  }
}
