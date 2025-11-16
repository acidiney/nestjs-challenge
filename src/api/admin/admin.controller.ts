import { Controller, Get, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';

@Controller('admin')
@ApiExcludeController()
export class AdminController {
  @Get()
  @Render('admin')
  index(): any {
    return Sentry.startSpan(
      { name: 'AdminController#index', op: 'controller' },
      async () => {
        return {};
      },
    );
  }
}
