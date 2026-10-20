import mongoose, { Schema, Document } from 'mongoose';

export type WalletTransactionType =
  | 'RECHARGE_CREDIT'
  | 'CAMPAIGN_LOCK'
  | 'CAMPAIGN_TOPUP_LOCK'
  | 'SPEND_SETTLEMENT'
  | 'REJECT_REFUND'
  | 'PARTIAL_UNSPENT_REFUND';

export interface IAdWalletTransaction extends Document {
  wallet_id: mongoose.Types.ObjectId;
  owner_user_id: mongoose.Types.ObjectId;
  campaign_id?: mongoose.Types.ObjectId;
  transaction_type: WalletTransactionType;
  credit_amount: number;
  gst_amount: number;
  total_gateway_paid: number;
  payment_mode: 'LOCAL_MOCK_TEST' | 'RAZORPAY' | 'ADMIN_MANUAL_ADJUST';
  payment_reference_id?: string;
  invoice_number?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdWalletTransactionSchema = new Schema<IAdWalletTransaction>(
  {
    wallet_id: { type: Schema.Types.ObjectId, ref: 'AdWallet', required: true },
    owner_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaign_id: { type: Schema.Types.ObjectId, ref: 'AdCampaign', default: null },
    transaction_type: {
      type: String,
      enum: [
        'RECHARGE_CREDIT',
        'CAMPAIGN_LOCK',
        'CAMPAIGN_TOPUP_LOCK',
        'SPEND_SETTLEMENT',
        'REJECT_REFUND',
        'PARTIAL_UNSPENT_REFUND',
      ],
      required: true,
    },
    credit_amount: { type: Number, required: true },
    gst_amount: { type: Number, default: 0 },
    total_gateway_paid: { type: Number, default: 0 },
    payment_mode: {
      type: String,
      enum: ['LOCAL_MOCK_TEST', 'RAZORPAY', 'ADMIN_MANUAL_ADJUST'],
      default: 'LOCAL_MOCK_TEST',
    },
    payment_reference_id: { type: String, default: '' },
    invoice_number: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'ad_wallet_transactions',
  }
);

AdWalletTransactionSchema.index({ wallet_id: 1, createdAt: -1 });
AdWalletTransactionSchema.index({ owner_user_id: 1, createdAt: -1 });
AdWalletTransactionSchema.index({ campaign_id: 1 });

export default mongoose.models.AdWalletTransaction ||
  mongoose.model<IAdWalletTransaction>('AdWalletTransaction', AdWalletTransactionSchema);
