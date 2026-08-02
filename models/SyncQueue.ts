import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncQueue extends Document {
  eventId: string;
  eventType: string;
  targetPanel: 'admin' | 'builder' | 'visitor';
  endpoint: string;
  payload: Record<string, any>;
  status: 'pending' | 'retrying' | 'success' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  error?: string;
}

const SyncQueueSchema: Schema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    targetPanel: { type: String, required: true, enum: ['admin', 'builder', 'visitor'] },
    endpoint: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'retrying', 'success', 'failed'], index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    lastAttemptAt: Date,
    nextRetryAt: Date,
    error: String,
  },
  { timestamps: true }
);

export default mongoose.models.SyncQueue ||
  mongoose.model<ISyncQueue>('SyncQueue', SyncQueueSchema);
