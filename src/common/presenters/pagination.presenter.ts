import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export abstract class PaginationPresenter {
  @Expose()
  @ApiProperty({ description: 'Current page' })
  @IsInt()
  @Min(1)
  page: number;

  @Expose()
  @ApiProperty({ description: 'Total items' })
  @IsInt()
  total: number;

  @Expose()
  @ApiProperty({ description: 'Items per page' })
  @IsInt()
  @Min(1)
  perPage: number;

  abstract data: ReadonlyArray<object>;
}
