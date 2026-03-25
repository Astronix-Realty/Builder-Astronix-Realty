import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // select:false = won't return in queries by default
    userType: { type: String, required: true, enum: ["builder", "mandate"] },

    // Builder fields
    companyName: { type: String },
    developerName: { type: String },
    reraNumber: { type: String },
    website: { type: String },
    projectsCompleted: { type: String },

    // Mandate fields
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
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.models.User || mongoose.model("User", UserSchema)
