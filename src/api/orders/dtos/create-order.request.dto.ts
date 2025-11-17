import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateOrderRequestDTO {
  @ApiProperty({ description: 'Record ID', type: String })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  recordId: string;

  @ApiProperty({ description: 'Quantity to order', type: Number, example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
