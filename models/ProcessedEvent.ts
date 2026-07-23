import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessedEvent extends Document {
  eventId: string;
  sourcePanel: string;
  eventType: string;
  processedAt: Date;
}

const ProcessedEventSchema: Schema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    sourcePanel: { type: String, required: true },
    eventType: { type: String, required: true },
    processedAt: { type: Date, default: Date.now, expires: '30d' },
  },
  { timestamps: true }
);

export default mongoose.models.ProcessedEvent ||
  mongoose.model<IProcessedEvent>('ProcessedEvent', ProcessedEventSchema);
