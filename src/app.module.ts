import { createKeyv as createKeyvValkey } from '@keyv/valkey';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { ApiModule } from './api/api.module';
import { AppConfig } from './app.config';

@Module({
  imports: [
    SentryModule.forRoot(),
    MongooseModule.forRoot(AppConfig.mongoUrl),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: createKeyvValkey({
          uri:
            AppConfig.valkeyUrl ||
            `redis://${AppConfig.valkeyHost}:${AppConfig.valkeyPort}`,
        }),
      }),
    }),
    EventEmitterModule.forRoot(),
    ApiModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
