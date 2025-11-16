import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';

@Controller()
@ApiExcludeController()
export class RedirectController {
  @Get()
  @Redirect('/admin', 302)
  root(): void {
    Sentry.startSpan(
      { name: 'RedirectController#root', op: 'controller' },
      async () => {},
    );
  }
}
