import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'builder' | 'mandate' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  profile: Record<string, any>;
  builderId?: string;
  mandateId?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['builder', 'mandate', 'admin'], required: true },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  profile: { type: Schema.Types.Mixed, default: {} }, 
  builderId: { type: Schema.Types.ObjectId, ref: 'Builder' },
  mandateId: { type: Schema.Types.ObjectId, ref: 'Mandate' },
  isDeleted: { type: Boolean, default: false }
}, { 
  timestamps: true 
});

// Indexing
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
