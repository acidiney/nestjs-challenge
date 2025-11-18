import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
export class HealthPresenter {
  @Expose()
  @ApiProperty({ description: 'Health status', example: 'OK' })
  status: string;

  static fromOutput(status: string): HealthPresenter {
    const presenter = new HealthPresenter();
    presenter.status = status;
    return presenter;
  }
}
