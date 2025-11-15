export interface RecordsRepository<TRecord, TCreateDto, TUpdateDto> {
  create(dto: TCreateDto): Promise<TRecord>;
  updateById(id: string, dto: TUpdateDto): Promise<TRecord>;
}

export const RECORDS_REPOSITORY = Symbol('RECORDS_REPOSITORY');
