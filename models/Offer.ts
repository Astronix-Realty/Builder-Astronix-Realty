import mongoose, { Schema, Document } from "mongoose";

export interface IOffer extends Document {
  offerName: string;
  benefitText: string;
  benefitHighlight: string;
  description?: string;
  termsAndConditions?: string;
  offerType: "Flat Discount" | "Percentage Discount" | "Cashback" | "Free Amenities" | "Floor-rise Waiver" | "Parking Offers" | "EMI/Subvention Plans";
  visibility: "Public" | "Private" | "CRM Only" | "Mandate Only";
  priorityBadge: 
    | "None"
    | "Festive Offer"
    | "Limited Period Offer"
    | "Hot Deal Offer"
    | "Builder Exclusive Offer"
    | "Early Bird Offer"
    | "Launch Offer"
    | "Spot Booking Offer"
    | "Zero Stamp Duty Offer"
    | "Pre-Launch Offer"
    | "Flash Deal Offer"
    | "Mega Discount Offer"
    | "Hot Deal"
    | "Limited Time"
    | "Builder Exclusive";
  status: "active" | "draft" | "paused" | "expired";
  startDate?: Date;
  endDate?: Date;
  autoExpire: boolean;
  bannerImage?: string;
  
  propertyId: mongoose.Types.ObjectId; // Targeted Entity ID
  propertyLevel?: "township" | "project" | "tower" | "unit";
  targetScope?: "cascade" | "exact"; // cascade = auto-inherit to children, exact = only this level
  townshipId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  towerId?: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;

  totalViews: number;
  leadsGenerated: number;
  claimedOffers: number;

  builderId: mongoose.Types.ObjectId;
  accountId?: mongoose.Types.ObjectId;
  mandateId?: mongoose.Types.ObjectId;
  role: "builder" | "mandate";

  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>({
  offerName: { type: String, required: true },
  benefitText: { type: String, required: true },
  benefitHighlight: { type: String, default: "" },
  description: { type: String, default: "" },
  termsAndConditions: { type: String, default: "" },
  offerType: { 
    type: String, 
    enum: ["Flat Discount", "Percentage Discount", "Cashback", "Free Amenities", "Floor-rise Waiver", "Parking Offers", "EMI/Subvention Plans"],
    default: "Flat Discount"
  },
  visibility: { 
    type: String, 
    enum: ["Public", "Private", "CRM Only", "Mandate Only"],
    default: "Public"
  },
  priorityBadge: { 
    type: String, 
    enum: [
      "None",
      "Festive Offer",
      "Limited Period Offer",
      "Hot Deal Offer",
      "Builder Exclusive Offer",
      "Early Bird Offer",
      "Launch Offer",
      "Spot Booking Offer",
      "Zero Stamp Duty Offer",
      "Pre-Launch Offer",
      "Flash Deal Offer",
      "Mega Discount Offer",
      "Hot Deal",
      "Limited Time",
      "Builder Exclusive"
    ],
    default: "None"
  },
  status: { 
    type: String, 
    enum: ["active", "draft", "paused", "expired"],
    default: "draft"
  },
  startDate: { type: Date },
  endDate: { type: Date },
  autoExpire: { type: Boolean, default: false },
  bannerImage: { type: String, default: "" },

  propertyId: { type: Schema.Types.ObjectId, required: true },
  propertyLevel: { type: String, enum: ["township", "project", "tower", "unit"], default: "tower" },
  targetScope: { type: String, enum: ["cascade", "exact"], default: "cascade" },
  townshipId: { type: Schema.Types.ObjectId, ref: "Property" },
  projectId: { type: Schema.Types.ObjectId, ref: "Property" },
  towerId: { type: Schema.Types.ObjectId, ref: "Property" },
  unitId: { type: Schema.Types.ObjectId, ref: "Unit" },

  totalViews: { type: Number, default: 0 },
  leadsGenerated: { type: Number, default: 0 },
  claimedOffers: { type: Number, default: 0 },

  builderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  accountId: { type: Schema.Types.ObjectId, ref: "User" },
  mandateId: { type: Schema.Types.ObjectId, ref: "Mandate" },
  role: { type: String, enum: ["builder", "mandate"], default: "builder" },

  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, {
  timestamps: true
});

OfferSchema.index({ builderId: 1, status: 1 });
OfferSchema.index({ propertyId: 1, status: 1 });
OfferSchema.index({ mandateId: 1, status: 1 });
OfferSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 }); // Note: expireAfterSeconds works with TTL indexing, but usually we just cron job or filter.
OfferSchema.index({ createdAt: -1 });

export default mongoose.models.Offer || mongoose.model<IOffer>("Offer", OfferSchema);
