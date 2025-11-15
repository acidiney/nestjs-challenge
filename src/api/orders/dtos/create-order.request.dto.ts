import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateOrderRequestDTO {
  @ApiProperty({ description: 'Record ID', type: String })
  @IsString()
  @IsNotEmpty()
  recordId: string;

  @ApiProperty({ description: 'Quantity to order', type: Number, example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
