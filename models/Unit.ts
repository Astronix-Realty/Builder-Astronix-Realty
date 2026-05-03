import mongoose from "mongoose";

const UnitSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["unit"], default: "unit" },
    unitNumber: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    towerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    floorNumber: { type: Number },
    configuration: { type: String },
    area: { type: Number },
    price: { type: Number },
    ratePerSqft: { type: Number },
    facing: { type: String },
    location: { city: String, state: String, address: String },
    status: { type: String, enum: ["draft", "pending", "published", "rejected", "archived", "available", "booked", "sold", "blocked", "reserved"], default: "draft" },
    isActive: { type: Boolean, default: false },
    rejectionReason: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    publishedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null },
    draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null },
    builderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

UnitSchema.index({ parentId: 1 });
UnitSchema.index({ towerId: 1 });
UnitSchema.index({ projectId: 1 });
UnitSchema.index({ builderId: 1 });

export default mongoose.models.Unit || mongoose.model("Unit", UnitSchema);
