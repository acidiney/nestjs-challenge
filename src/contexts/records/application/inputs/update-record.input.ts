import { MBID } from '../../domain/value-objects/mbid.vo';

export type UpdateRecordInput = {
  artist?: string;
  album?: string;
  price?: number;
  qty?: number;
  format?: string;
  category?: string;
  mbid?: MBID;
};
