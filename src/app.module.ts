import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiModule } from './api/api.module';
import { AppConfig } from './app.config';

@Module({
  imports: [MongooseModule.forRoot(AppConfig.mongoUrl), ApiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
