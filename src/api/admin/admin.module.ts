import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { RedirectController } from './redirect.controller';

@Module({
  controllers: [AdminController, RedirectController],
})
export class AdminModule {}
