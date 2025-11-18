import { Expose } from 'class-transformer';

import { Tracklist } from '@/contexts/records/domain/types/tracklist.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class TracklistPresenter {
  @Expose()
  @ApiProperty({ description: 'Track title', example: 'Track 1' })
  @IsNotEmpty()
  title: string;

  @Expose()
  @ApiProperty({ description: 'Track slug', example: 'track-1' })
  @IsNotEmpty()
  slug: string;

  @Expose()
  @ApiProperty({ description: 'Track duration', example: '3:30' })
  @IsNotEmpty()
  length: string;

  @Expose()
  @ApiProperty({ description: 'Track release date', example: '2021-01' })
  @IsNotEmpty()
  releaseDate: string;

  static fromOutput(model: Tracklist): TracklistPresenter {
    const presenter = new TracklistPresenter();
    presenter.title = model.title;
    presenter.length = model.length;
    presenter.slug = this.slugify(model.title + model.length);
    presenter.releaseDate = model.releaseDate;

    return presenter;
  }

  private static slugify(str: string) {
    str = str.replace(/^\s+|\s+$/g, '');
    str = str.toLowerCase();
    str = str
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return str;
  }
}
