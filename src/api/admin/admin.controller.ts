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
        const allowedDomains =
          process.env.SENTRY_ALLOWED_DOMAINS?.split(',') || [];
        return {
          SENTRY_DSN: process.env.SENTRY_DSN,
          SENTRY_ALLOWED_DOMAINS: allowedDomains,
          SENTRY_FE_HASH_SCRIPT: process.env.SENTRY_FE_HASH_SCRIPT,
        };
      },
    );
  }
}
