import mongoose, { Schema, Document } from 'mongoose';

export type BuyerSegment = 'AFFORDABLE' | 'MID_SEGMENT' | 'LUXURY_HNI' | 'COMMERCIAL';

export interface IAdAudiencePreset extends Document {
  preset_code: string;
  preset_title: string;
  buyer_segment: BuyerSegment;
  guide_description_hinglish: string;
  default_radius_km: number;
  age_min: number;
  age_max: number;
  target_countries_json: string[];
  target_cities_json: string[];
  meta_interests_json: any;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdAudiencePresetSchema = new Schema<IAdAudiencePreset>(
  {
    preset_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    preset_title: { type: String, required: true, trim: true },
    buyer_segment: {
      type: String,
      enum: ['AFFORDABLE', 'MID_SEGMENT', 'LUXURY_HNI', 'COMMERCIAL'],
      default: 'MID_SEGMENT',
    },
    guide_description_hinglish: { type: String, default: '' },
    default_radius_km: { type: Number, default: 15 },
    age_min: { type: Number, default: 25 },
    age_max: { type: Number, default: 55 },
    target_countries_json: { type: [String], default: ['IN'] },
    target_cities_json: { type: [String], default: [] },
    meta_interests_json: { type: Schema.Types.Mixed, default: [] },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'ad_audience_presets',
  }
);

AdAudiencePresetSchema.index({ is_active: 1 });

export default mongoose.models.AdAudiencePreset ||
  mongoose.model<IAdAudiencePreset>('AdAudiencePreset', AdAudiencePresetSchema);
