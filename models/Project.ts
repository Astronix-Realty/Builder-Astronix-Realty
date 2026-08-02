import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    townshipId: { type: String, required: true }, // Referencing township (could be ObjectId in real app)
    reraNumber: { type: String },
    possessionDate: { type: Date },
    // Other fields omitted for brevity...
  },
  { timestamps: true }
);

// Cascade delete Towers and Units when a Project is removed
ProjectSchema.pre("findOneAndDelete", async function (next) {
  try {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
      await mongoose.model("Tower").deleteMany({ projectId: docToUpdate._id });
      // Depending on the schema, if Units hold a direct projectId, delete them here.
      // Or they might be cascade deleted via Tower's pre-delete hook.
      // Usually, just deleting the Tower should trigger the unit cascade down.
      // We will also manually delete units that reference this projectId if they do.
      if (mongoose.models.Unit) {
          await mongoose.model("Unit").deleteMany({ projectId: docToUpdate._id });
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);
