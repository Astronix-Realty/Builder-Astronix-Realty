import mongoose from "mongoose";

const TowerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    projectId: { type: String, required: true }, // Referencing project
    totalFloors: { type: Number },
    unitsPerFloor: { type: Number },
    reraNumber: { type: String },
    // Other fields omitted for brevity...
  },
  { timestamps: true }
);

// Cascade delete Units when a Tower is removed
TowerSchema.pre("findOneAndDelete", async function (next) {
  try {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
      if (mongoose.models.Unit) {
        await mongoose.model("Unit").deleteMany({ towerId: docToUpdate._id });
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

TowerSchema.pre("deleteMany", async function(next) {
    try {
        const docs = await this.model.find(this.getQuery());
        const towerIds = docs.map(d => d._id);
        if (towerIds.length > 0 && mongoose.models.Unit) {
            await mongoose.model("Unit").deleteMany({ towerId: { $in: towerIds } });
        }
        next();
    } catch(err: any) {
        next(err);
    }
})

export default mongoose.models.Tower || mongoose.model("Tower", TowerSchema);
