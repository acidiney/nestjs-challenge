import { createKeyv as createKeyvValkey } from '@keyv/valkey';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiModule } from './api/api.module';
import { AppConfig } from './app.config';

@Module({
  imports: [
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
  providers: [],
})
export class AppModule {}
