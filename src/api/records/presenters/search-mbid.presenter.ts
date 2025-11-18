import { MBID } from '@/contexts/records/domain/value-objects/mbid.vo';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

export class SearchMbidPresenter {
  @Expose()
  @ApiProperty({ description: 'MBID of the record' })
  @IsUUID()
  @IsOptional()
  mbid?: string;

  static fromOutput(mbid?: MBID): SearchMbidPresenter {
    const presenter = new SearchMbidPresenter();
    presenter.mbid = mbid?.toString() || null;
    return presenter;
  }
}
