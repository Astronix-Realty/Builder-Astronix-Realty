import mongoose from "mongoose";

const UnitSchema = new mongoose.Schema(
  {
    unitNumber: { type: String, required: true },
    towerId: { type: String, required: true },
    projectId: { type: String, required: true },
    floorNumber: { type: Number },
    configuration: { type: String },
    area: { type: Number },
    price: { type: Number },
    status: { type: String, default: "available" },
    // Other fields omitted...
  },
  { timestamps: true }
);

export default mongoose.models.Unit || mongoose.model("Unit", UnitSchema);
