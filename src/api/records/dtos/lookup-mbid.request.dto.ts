import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LookupMbidRequestDTO {
  @ApiProperty({ example: 'The Beatles' })
  @IsString()
  @MinLength(1)
  artist!: string;

  @ApiProperty({ example: 'Abbey Road' })
  @IsString()
  @MinLength(1)
  album!: string;
}
