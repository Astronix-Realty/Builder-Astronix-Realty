import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const BuilderSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false, select: false },
    userType: { type: String, default: "builder" },

    // Builder specific fields
    companyName: { type: String },
    developerName: { type: String },
    reraNumber: { type: String },
    website: { type: String },
    projectsCompleted: { type: String },

    // Common fields
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    experience: { type: String },
    logo: { type: String },
  },
  { timestamps: true }
)

// Hash password before saving
BuilderSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
BuilderSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

delete (mongoose.models as any).Builder
export default mongoose.models.Builder || mongoose.model("Builder", BuilderSchema)

