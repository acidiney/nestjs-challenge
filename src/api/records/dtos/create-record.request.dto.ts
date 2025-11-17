import { RecordCategory } from '@/contexts/records/domain/enums/record-category.enum';
import { RecordFormat } from '@/contexts/records/domain/enums/record-format.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MBID } from './../../../contexts/records/domain/value-objects/mbid.vo';

export class CreateRecordRequestDTO {
  @ApiProperty({
    description: 'Artist of the record',
    type: String,
    example: 'The Beatles',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  artist: string;

  @ApiProperty({
    description: 'Album name',
    type: String,
    example: 'Abbey Road',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  album: string;

  @ApiProperty({
    description: 'Price of the record',
    type: Number,
    example: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(10000)
  price: number;

  @ApiProperty({
    description: 'Quantity of the record in stock',
    type: Number,
    example: 1000,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  qty: number;

  @ApiProperty({
    description: 'Format of the record (Vinyl, CD, etc.)',
    enum: RecordFormat,
    example: RecordFormat.VINYL,
  })
  @IsEnum(RecordFormat)
  @IsNotEmpty()
  format: RecordFormat;

  @ApiProperty({
    description: 'Category or genre of the record (e.g., Rock, Jazz)',
    enum: RecordCategory,
    example: RecordCategory.ROCK,
  })
  @IsEnum(RecordCategory)
  @IsNotEmpty()
  category: RecordCategory;

  @ApiProperty({
    description: 'Musicbrainz identifier',
    type: String,
    example: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? MBID.from(value) : undefined))
  mbid?: MBID;
}
