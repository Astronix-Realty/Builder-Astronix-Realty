import mongoose, { Schema, Document } from 'mongoose';

export type LeadSourcePlatform =
  | 'FACEBOOK_INSTANT_FORM'
  | 'INSTAGRAM_INSTANT_FORM'
  | 'WHATSAPP_AD'
  | 'LOCAL_SIMULATOR';

export type CrmStage =
  | 'NEW_UNREAD'
  | 'CONTACTED'
  | 'FOLLOW_UP'
  | 'SITE_VISIT_SCHEDULED'
  | 'SITE_VISIT_DONE'
  | 'BOOKED_CLOSED'
  | 'INVALID_JUNK';

export interface IAdLeadCrm extends Document {
  campaign_id: mongoose.Types.ObjectId;
  owner_user_id: mongoose.Types.ObjectId;
  root_property_id: mongoose.Types.ObjectId;
  target_hierarchy_level: string;
  hierarchy_breadcrumb: string;
  meta_leadgen_id: string;
  buyer_full_name: string;
  buyer_phone: string;
  buyer_email?: string;
  buyer_city?: string;
  qualification_answers_json: any;
  lead_source_platform: LeadSourcePlatform;
  crm_status: CrmStage;
  builder_remarks?: string;
  is_duplicate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdLeadCrmSchema = new Schema<IAdLeadCrm>(
  {
    campaign_id: { type: Schema.Types.ObjectId, ref: 'AdCampaign', required: true },
    owner_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    root_property_id: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    target_hierarchy_level: { type: String, default: 'WHOLE_PROPERTY' },
    hierarchy_breadcrumb: { type: String, required: true },
    meta_leadgen_id: { type: String, required: true, unique: true },
    buyer_full_name: { type: String, required: true, trim: true },
    buyer_phone: { type: String, required: true, trim: true },
    buyer_email: { type: String, default: null, trim: true },
    buyer_city: { type: String, default: null, trim: true },
    qualification_answers_json: { type: Schema.Types.Mixed, default: {} },
    lead_source_platform: {
      type: String,
      enum: ['FACEBOOK_INSTANT_FORM', 'INSTAGRAM_INSTANT_FORM', 'WHATSAPP_AD', 'LOCAL_SIMULATOR'],
      default: 'LOCAL_SIMULATOR',
    },
    crm_status: {
      type: String,
      enum: [
        'NEW_UNREAD',
        'CONTACTED',
        'FOLLOW_UP',
        'SITE_VISIT_SCHEDULED',
        'SITE_VISIT_DONE',
        'BOOKED_CLOSED',
        'INVALID_JUNK',
      ],
      default: 'NEW_UNREAD',
    },
    builder_remarks: { type: String, default: '' },
    is_duplicate: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'ad_leads_crm',
  }
);

AdLeadCrmSchema.index({ owner_user_id: 1, crm_status: 1 });
AdLeadCrmSchema.index({ campaign_id: 1, createdAt: -1 });
AdLeadCrmSchema.index({ buyer_phone: 1 });

export default mongoose.models.AdLeadCrm ||
  mongoose.model<IAdLeadCrm>('AdLeadCrm', AdLeadCrmSchema);
