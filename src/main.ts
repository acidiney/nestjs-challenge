import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Import Swagger
import { resolve } from 'path';
import { AppConfig } from './app.config';
import { AppModule } from './app.module';
import './instrument';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const viewPath =
    process.env.NODE_ENV === 'development'
      ? resolve(__dirname, '..', 'views') // On development it adds src to the path, so we need to go up one level
      : resolve(__dirname, 'views');

  app.setBaseViewsDir(viewPath);
  app.setViewEngine('hbs');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Record API')
    .setDescription('The record management API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(AppConfig.port);
}
bootstrap();
