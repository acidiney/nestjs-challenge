export interface RecordModel {
  id?: string;
  artist: string;
  album: string;
  price: number;
  qty: number;
  format: string;
  category: string;
  created?: Date;
  lastModified?: Date;
  mbid?: string;
}
