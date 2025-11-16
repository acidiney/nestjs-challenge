import { CacheInterceptor } from '@nestjs/cache-manager';
import { CallHandler, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  protected isRequestCacheable(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV === 'test') {
      return false;
    }
    return super.isRequestCacheable(context);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    if (!this.isRequestCacheable(context)) {
      return next.handle();
    }
    const key = this.trackBy(context);
    if (!key) {
      return next.handle();
    }
    const res = context.switchToHttp().getResponse();
    try {
      const cached = await (this.cacheManager as any).get(key);
      if (cached !== undefined) {
        if (res?.setHeader) res.setHeader('X-Cache', 'HIT');
        return of(cached);
      }
    } catch {}
    if (res?.setHeader) res.setHeader('X-Cache', 'MISS');
    return next.handle().pipe(
      tap(async (response) => {
        try {
          await (this.cacheManager as any).set(key, response);
        } catch {}
      }),
    );
  }
}
