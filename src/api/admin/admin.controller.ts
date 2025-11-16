import { Controller, Get, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('admin')
@ApiExcludeController()
export class AdminController {
  @Get()
  @Render('admin')
  index(): any {}
}
