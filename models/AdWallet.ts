import mongoose, { Schema, Document } from 'mongoose';

export interface IAdWallet extends Document {
  owner_user_id: mongoose.Types.ObjectId;
  owner_role: 'BUILDER' | 'MANDATE';
  available_balance: number;
  locked_escrow_balance: number;
  lifetime_spent_balance: number;
  company_gstin?: string;
  billing_company_name?: string;
  billing_address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdWalletSchema = new Schema<IAdWallet>(
  {
    owner_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    owner_role: { type: String, enum: ['BUILDER', 'MANDATE'], required: true },
    available_balance: { type: Number, default: 0.0 },
    locked_escrow_balance: { type: Number, default: 0.0 },
    lifetime_spent_balance: { type: Number, default: 0.0 },
    company_gstin: { type: String, default: null, trim: true },
    billing_company_name: { type: String, default: null, trim: true },
    billing_address: { type: String, default: null, trim: true },
  },
  {
    timestamps: true,
    collection: 'ad_wallets',
  }
);

AdWalletSchema.index({ owner_user_id: 1 });
AdWalletSchema.index({ owner_role: 1 });

export default mongoose.models.AdWallet || mongoose.model<IAdWallet>('AdWallet', AdWalletSchema);
