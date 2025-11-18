import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import { HealthPresenter } from './common/presenters/health.presenter';

@Controller()
export class AppController {
  @Get()
  @Redirect('/admin', 302)
  @ApiExcludeEndpoint()
  root(): void {
    Sentry.startSpan(
      { name: 'RedirectController#root', op: 'controller' },
      async () => {},
    );
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: 200,
    description: 'Health check',
    type: HealthPresenter,
  })
  health() {
    return Sentry.startSpan(
      { name: 'AppController#health', op: 'controller' },
      () => {
        return HealthPresenter.fromOutput('OK');
      },
    );
  }
}
