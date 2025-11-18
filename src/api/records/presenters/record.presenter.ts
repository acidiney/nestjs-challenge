import { RecordOutput } from '@/contexts/records/application/outputs/record.output';
import { RecordCategory } from '@/contexts/records/domain/enums/record-category.enum';
import { RecordFormat } from '@/contexts/records/domain/enums/record-format.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { TracklistPresenter } from './tracklist.presenter';

export class RecordPresenter {
  @Expose()
  @ApiProperty({ description: 'Record ID' })
  @IsNotEmpty()
  id: string;

  @Expose()
  @ApiProperty({ description: 'Record artist', example: 'Artist 1' })
  @IsNotEmpty()
  artist: string;

  @Expose()
  @ApiProperty({ description: 'Record album', example: 'Album 1' })
  @IsNotEmpty()
  album: string;

  @Expose()
  @ApiProperty({ description: 'Record price', example: 30 })
  @IsNotEmpty()
  price: number;

  @Expose()
  @ApiProperty({ description: 'Record quantity', example: 100 })
  @IsNotEmpty()
  qty: number;

  @Expose()
  @ApiProperty({
    description: 'Record format',
    example: 'CD',
    enum: RecordFormat,
  })
  @IsNotEmpty()
  format: string;

  @Expose()
  @ApiProperty({
    description: 'Record category',
    example: 'Pop',
    enum: RecordCategory,
  })
  @IsNotEmpty()
  category: string;

  @Expose()
  @ApiProperty({ description: 'Record creation date' })
  @IsNotEmpty()
  created: Date;

  @Expose()
  @ApiProperty({ description: 'Record last modification date' })
  @IsNotEmpty()
  lastModified: Date;

  @Expose()
  @ApiProperty({
    description: 'Record MBID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  mbid: string;

  @Expose()
  @ApiProperty({
    description: 'Record tracklist',
    type: () => [TracklistPresenter],
  })
  @IsArray()
  @Type(() => TracklistPresenter)
  @ValidateNested({ each: true })
  tracklist: ReadonlyArray<TracklistPresenter>;

  static fromOutput(model: RecordOutput): RecordPresenter {
    const presenter = new RecordPresenter();

    presenter.id = model.id;
    presenter.artist = model.artist;
    presenter.album = model.album;
    presenter.price = model.price;
    presenter.qty = model.qty;
    presenter.format = model.format;
    presenter.category = model.category;
    presenter.created = model.created;
    presenter.lastModified = model.lastModified;
    presenter.mbid = model.mbid?.toString();
    presenter.tracklist = (model.tracklist ?? []).map((track) =>
      TracklistPresenter.fromOutput(track),
    );

    return presenter;
  }
}
