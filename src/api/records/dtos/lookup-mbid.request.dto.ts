import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class LookupMbidRequestDTO {
  @ApiProperty({ example: 'The Beatles' })
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => value.trim())
  artist!: string;

  @ApiProperty({ example: 'Abbey Road' })
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => value.trim())
  album!: string;
}
