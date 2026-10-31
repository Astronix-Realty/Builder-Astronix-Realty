import mongoose, { Schema, Document } from 'mongoose';

export type HierarchyLevel = 'WHOLE_PROPERTY' | 'PHASE_OR_PROJECT' | 'TOWER_OR_WING' | 'UNIT_OR_CONFIG';
export type CampaignObjective = 'INSTANT_LEAD_FORM' | 'WHATSAPP_MESSAGES' | 'DYNAMIC_CATALOG_CAROUSEL';
export type AdFormat = 'SINGLE_VIDEO' | 'SINGLE_IMAGE' | 'MULTI_CARD_CAROUSEL';
export type CtaButtonType = 'LEARN_MORE' | 'DOWNLOAD' | 'APPLY_NOW' | 'GET_QUOTE' | 'BOOK_NOW' | 'WHATSAPP_MESSAGE';
export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_ADMIN_APPROVAL'
  | 'APPROVED_PUSHING_TO_META'
  | 'IN_META_REVIEW'
  | 'ACTIVE_RUNNING'
  | 'PAUSED_BY_USER'
  | 'PAUSED_BY_ADMIN'
  | 'PAUSED_PROPERTY_UNPUBLISHED'
  | 'REJECTED_BY_ADMIN'
  | 'DISAPPROVED_BY_META'
  | 'COMPLETED_BUDGET_FULL';

export interface IAdCampaign extends Document {
  campaign_code: string;
  owner_user_id: mongoose.Types.ObjectId;
  owner_role: 'BUILDER' | 'MANDATE';
  root_property_id: mongoose.Types.ObjectId;
  target_hierarchy_level: HierarchyLevel;
  target_phase_id?: string;
  target_tower_id?: string;
  target_unit_id?: string;
  hierarchy_breadcrumb: string;
  property_snapshot_json: any;
  landing_deep_link_url: string;
  campaign_objective: CampaignObjective;
  ad_format: AdFormat;
  media_files_json: Array<{
    url: string;
    type: 'video' | 'image';
    thumbnail_url?: string;
    aspect_ratio?: string;
  }>;
  primary_text: string;
  headline: string;
  short_description?: string;
  cta_button_type: CtaButtonType;
  audience_preset_id?: mongoose.Types.ObjectId;
  custom_targeting_json: any;
  lead_form_questions_json: any;
  whatsapp_number?: string;
  total_builder_budget: number;
  platform_commission_percent: number;
  platform_commission_amount: number;
  net_meta_budget: number;
  spend_limit_inr?: number;
  duration_days: number;
  start_date: Date;
  end_date: Date;
  status: CampaignStatus;
  admin_rejection_reason?: string;
  meta_rejection_feedback?: string;
  admin_edited_notes?: string;
  approved_by_admin_id?: string;
  approved_at?: Date;
  execution_mode: 'LOCAL_SIMULATION' | 'LIVE_META_API';
  meta_campaign_id?: string;
  meta_adset_id?: string;
  meta_creative_id?: string;
  meta_ad_id?: string;
  meta_leadform_id?: string;
  meta_product_set_id?: string;
  meta_video_or_image_id?: string;
  metrics_impressions: number;
  metrics_reach: number;
  metrics_clicks: number;
  metrics_leads_count: number;
  metrics_meta_spent_inr: number;
  metrics_builder_spent_inr: number;
  last_synced_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdCampaignSchema = new Schema<IAdCampaign>(
  {
    campaign_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    owner_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    owner_role: { type: String, enum: ['BUILDER', 'MANDATE'], default: 'BUILDER' },
    root_property_id: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    target_hierarchy_level: {
      type: String,
      enum: ['WHOLE_PROPERTY', 'PHASE_OR_PROJECT', 'TOWER_OR_WING', 'UNIT_OR_CONFIG'],
      default: 'WHOLE_PROPERTY',
    },
    target_phase_id: { type: String, default: null },
    target_tower_id: { type: String, default: null },
    target_unit_id: { type: String, default: null },
    hierarchy_breadcrumb: { type: String, required: true },
    property_snapshot_json: { type: Schema.Types.Mixed, default: {} },
    landing_deep_link_url: { type: String, required: true },
    campaign_objective: {
      type: String,
      enum: ['INSTANT_LEAD_FORM', 'WHATSAPP_MESSAGES', 'DYNAMIC_CATALOG_CAROUSEL'],
      default: 'INSTANT_LEAD_FORM',
    },
    ad_format: {
      type: String,
      enum: ['SINGLE_VIDEO', 'SINGLE_IMAGE', 'MULTI_CARD_CAROUSEL'],
      default: 'SINGLE_VIDEO',
    },
    media_files_json: { type: Schema.Types.Mixed, default: [] },
    primary_text: { type: String, required: true },
    headline: { type: String, required: true },
    short_description: { type: String, default: '' },
    cta_button_type: {
      type: String,
      enum: ['LEARN_MORE', 'DOWNLOAD', 'APPLY_NOW', 'GET_QUOTE', 'BOOK_NOW', 'WHATSAPP_MESSAGE'],
      default: 'DOWNLOAD',
    },
    audience_preset_id: { type: Schema.Types.ObjectId, ref: 'AdAudiencePreset', default: null },
    custom_targeting_json: { type: Schema.Types.Mixed, default: {} },
    lead_form_questions_json: { type: Schema.Types.Mixed, default: [] },
    whatsapp_number: { type: String, default: null },
    total_builder_budget: { type: Number, required: true },
    platform_commission_percent: { type: Number, default: 10 },
    platform_commission_amount: { type: Number, default: 0 },
    net_meta_budget: { type: Number, default: 0 },
    spend_limit_inr: { type: Number, default: null },
    duration_days: { type: Number, default: 7 },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, required: true },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_ADMIN_APPROVAL',
        'APPROVED_PUSHING_TO_META',
        'IN_META_REVIEW',
        'ACTIVE_RUNNING',
        'PAUSED_BY_USER',
        'PAUSED_BY_ADMIN',
        'PAUSED_PROPERTY_UNPUBLISHED',
        'REJECTED_BY_ADMIN',
        'DISAPPROVED_BY_META',
        'COMPLETED_BUDGET_FULL',
      ],
      default: 'PENDING_ADMIN_APPROVAL',
    },
    admin_rejection_reason: { type: String, default: null },
    meta_rejection_feedback: { type: String, default: null },
    admin_edited_notes: { type: String, default: null },
    approved_by_admin_id: { type: String, default: null },
    approved_at: { type: Date, default: null },
    execution_mode: {
      type: String,
      enum: ['LOCAL_SIMULATION', 'LIVE_META_API'],
      default: 'LOCAL_SIMULATION',
    },
    meta_campaign_id: { type: String, default: null },
    meta_adset_id: { type: String, default: null },
    meta_creative_id: { type: String, default: null },
    meta_ad_id: { type: String, default: null },
    meta_leadform_id: { type: String, default: null },
    meta_product_set_id: { type: String, default: null },
    meta_video_or_image_id: { type: String, default: null },
    metrics_impressions: { type: Number, default: 0 },
    metrics_reach: { type: Number, default: 0 },
    metrics_clicks: { type: Number, default: 0 },
    metrics_leads_count: { type: Number, default: 0 },
    metrics_meta_spent_inr: { type: Number, default: 0.0 },
    metrics_builder_spent_inr: { type: Number, default: 0.0 },
    last_synced_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'ad_campaigns',
  }
);

AdCampaignSchema.index({ owner_user_id: 1, status: 1 });
AdCampaignSchema.index({ root_property_id: 1 });
AdCampaignSchema.index({ status: 1 });
AdCampaignSchema.index({ meta_campaign_id: 1 });

export default mongoose.models.AdCampaign ||
  mongoose.model<IAdCampaign>('AdCampaign', AdCampaignSchema);
