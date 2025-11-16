import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller()
@ApiExcludeController()
export class RedirectController {
  @Get()
  @Redirect('/admin', 302)
  root(): void {}
}
