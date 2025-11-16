import { Tracklist } from '../../domain/types/tracklist.type';
import { MBID } from '../../domain/value-objects/mbid.vo';

export type CreateRecordInput = {
  artist: string;
  album: string;
  price: number;
  qty: number;
  format: string;
  category: string;
  mbid?: MBID;
  tracklist?: Tracklist[];
};
