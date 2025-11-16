import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { Tracklist } from '@/contexts/records/domain/types/tracklist.type';
import { RecordCategory } from './../../../../domain/enums/record-category.enum';
import { RecordFormat } from './../../../../domain/enums/record-format.enum';

@Schema({ timestamps: true })
export class Record extends Document {
  @Prop({ required: true })
  artist: string;

  @Prop({ required: true })
  album: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  qty: number;

  @Prop({ enum: RecordFormat, required: true })
  format: RecordFormat;

  @Prop({ enum: RecordCategory, required: true })
  category: RecordCategory;

  @Prop({ default: Date.now })
  created: Date;

  @Prop({ default: Date.now })
  lastModified: Date;

  @Prop({ required: false })
  mbid?: string;

  @Prop({ type: [Object], required: false, default: [] })
  tracklist?: Tracklist[];
}

export type RecordDocument = Record & Document;

export const RecordSchema = SchemaFactory.createForClass(Record);

RecordSchema.index(
  {
    artist: 'text',
    album: 'text',
  },
  {
    weights: { artist: 5, album: 4 },
    name: 'text_artist_album',
  },
);

RecordSchema.index({ category: 1, price: 1 }, { name: 'idx_category_price' });

RecordSchema.index({ price: 1 }, { name: 'idx_price_asc' });
RecordSchema.index({ format: 1 }, { name: 'idx_format' });
RecordSchema.index({ created: -1 }, { name: 'idx_created_desc' });
RecordSchema.index({ lastModified: -1 }, { name: 'idx_lastModified_desc' });
