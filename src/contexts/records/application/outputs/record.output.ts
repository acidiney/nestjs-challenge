import { RecordModel } from '../../domain/models/record.model';

export class RecordOutput {
  id?: string;
  artist!: string;
  album!: string;
  price!: number;
  qty!: number;
  format!: string;
  category!: string;
  created?: Date;
  lastModified?: Date;
  mbid?: string;
  tracklist?: string[];

  constructor(props: RecordModel) {
    this.id = props.id;
    this.artist = props.artist;
    this.album = props.album;
    this.price = props.price;
    this.qty = props.qty;
    this.format = props.format;
    this.category = props.category;
    this.created = props.created;
    this.lastModified = props.lastModified;
    this.mbid = props.mbid?.toString();
    this.tracklist = props.tracklist ?? [];
  }

  static fromModel(model: RecordModel): RecordOutput {
    return new RecordOutput(model);
  }
}
