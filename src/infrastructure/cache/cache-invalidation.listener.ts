import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheInvalidationListener {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  @OnEvent('cache.invalidate', { async: true })
  async onRecordsChanged(pattern: string): Promise<void> {
    const keys = await this.getKeys();

    const matchedKeys = keys.filter((key) => key.startsWith(pattern));

    await this.cache.mdel(matchedKeys);
  }

  async getKeys() {
    const storeIterator = this.cache.stores[0]?.iterator;

    const keys: string[] = [];
    if (storeIterator) {
      for await (const [key] of storeIterator('namespace')) {
        keys.push(key);
      }
    }

    return keys;
  }
}
