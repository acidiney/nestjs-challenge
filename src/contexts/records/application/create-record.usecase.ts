import { Inject, Injectable } from '@nestjs/common';
import { CreateRecordRequestDTO } from '../../../api/dtos/create-record.request.dto';
import { Record } from '../../../api/schemas/record.schema';
import {
  RECORDS_REPOSITORY,
  RecordsRepository,
} from '../../records/domain/repositories/records.repository';

@Injectable()
export class CreateRecordUseCase {
  constructor(
    @Inject(RECORDS_REPOSITORY)
    private readonly repo: RecordsRepository<
      Record,
      CreateRecordRequestDTO,
      any
    >,
  ) {}

  async execute(dto: CreateRecordRequestDTO): Promise<Record> {
    return this.repo.create(dto);
  }
}
