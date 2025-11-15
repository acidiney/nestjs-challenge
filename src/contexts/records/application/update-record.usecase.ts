import { Inject, Injectable } from '@nestjs/common';
import { UpdateRecordRequestDTO } from '../../../api/dtos/update-record.request.dto';
import { Record } from '../../../api/schemas/record.schema';
import {
  RECORDS_REPOSITORY,
  RecordsRepository,
} from '../../records/domain/repositories/records.repository';

@Injectable()
export class UpdateRecordUseCase {
  constructor(
    @Inject(RECORDS_REPOSITORY)
    private readonly repo: RecordsRepository<
      Record,
      any,
      UpdateRecordRequestDTO
    >,
  ) {}

  async execute(id: string, dto: UpdateRecordRequestDTO): Promise<Record> {
    return this.repo.updateById(id, dto);
  }
}
