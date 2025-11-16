import { Controller, Get, Redirect } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Controller()
export class AppController {
  @Get()
  @Redirect('/admin', 302)
  root(): void {
    Sentry.startSpan(
      { name: 'RedirectController#root', op: 'controller' },
      async () => {},
    );
  }

  @Get('health')
  health() {
    return Sentry.startSpan(
      { name: 'AppController#health', op: 'controller' },
      () => {
        return {
          status: 'OK',
        };
      },
    );
  }
}
