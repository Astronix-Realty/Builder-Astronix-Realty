import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const MandateSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    userType: { type: String, default: "mandate" },

    // Mandate specific fields
    fullName: { type: String },
    panNumber: { type: String },
    aadharNumber: { type: String },
    specialization: { type: String },
    preferredAreas: { type: String },

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
MandateSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
MandateSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.models.Mandate || mongoose.model("Mandate", MandateSchema)
