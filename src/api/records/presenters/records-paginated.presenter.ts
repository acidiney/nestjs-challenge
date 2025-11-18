import { PaginationPresenter } from '@/common/presenters/pagination.presenter';
import { RecordsPageOutput } from '@/contexts/records/application/outputs/records-page.output';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { RecordPresenter } from './record.presenter';

export class RecordsPaginatedPresenter extends PaginationPresenter {
  @Expose()
  @ApiProperty({ description: 'List of items', type: () => [RecordPresenter] })
  @IsArray()
  @Type(() => RecordPresenter)
  @ValidateNested({ each: true })
  data: ReadonlyArray<RecordPresenter>;

  static fromOutput(model: RecordsPageOutput): RecordsPaginatedPresenter {
    const presenter = new RecordsPaginatedPresenter();
    presenter.total = model.total;
    presenter.perPage = model.perPage;
    presenter.page = model.page;

    presenter.data = model.data.map((item) => RecordPresenter.fromOutput(item));

    return presenter;
  }
}
