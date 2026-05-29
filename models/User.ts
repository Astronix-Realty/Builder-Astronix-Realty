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
  // OTP for logged-in password change
  otp?: string;
  otpExpiry?: Date;
  otpRequestCount?: number;
  otpWindowStart?: Date;
  lastOtpSentAt?: Date;
  // Forgot password flow
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  passwordResetRequestCount?: number;
  passwordResetWindowStart?: Date;
  lastPasswordResetSentAt?: Date;
  // Security & login tracking
  loginAttempts?: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['builder', 'mandate', 'admin'], required: true },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  profile: { type: Schema.Types.Mixed, default: {} }, 
  builderId: { type: Schema.Types.ObjectId, ref: 'Builder' },
  mandateId: { type: Schema.Types.ObjectId, ref: 'Mandate' },
  isDeleted: { type: Boolean, default: false },
  // OTP fields (logged-in password change)
  otp: { type: String },
  otpExpiry: { type: Date },
  otpRequestCount: { type: Number, default: 0 },
  otpWindowStart: { type: Date },
  lastOtpSentAt: { type: Date },
  // Forgot password fields
  passwordResetToken: { type: String },
  passwordResetExpiry: { type: Date },
  passwordResetRequestCount: { type: Number, default: 0 },
  passwordResetWindowStart: { type: Date },
  lastPasswordResetSentAt: { type: Date },
  // Security & login tracking
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },
}, { 
  timestamps: true 
});

// Indexing
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ passwordResetToken: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
