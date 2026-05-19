import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Name is required"] 
    },
    email: { 
        type: String,
        lowercase: true,
        trim: true
    },
    phone: { 
        type: String, 
        required: [true, "Phone number is required"] 
    },
    source: { 
        type: String, 
        default: "Website",
        // enum: ["Website", "WhatsApp", "Facebook Ad", "Instagram Ad", "Walk-in", "Referral", "Manual Entry", "Other"]
    },
    status: { 
        type: String, 
        default: "Fresh",
        // enum: ["Fresh", "Token VIP", "Connected", "Site Visit", "Negotiation", "Booked", "Junk"]
    },
    builderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        index: true 
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    role: {
        type: String,
        enum: ["builder", "mandate"],
        default: "builder",
        index: true
    },
    mandateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Mandate",
        index: true
    },
    projectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Project",
        index: true
    },
    requirement: { type: String },
    budget: { type: String },
    assignee: { type: String },
    isTokenPaid: { type: Boolean, default: false },
    interestedUnit: { type: String },
    notes: [String],
    timeline: [{
        date: { type: Date, default: Date.now },
        title: { type: String, required: true },
        desc: { type: String },
        type: { 
            type: String, 
            // enum: ["call", "visit", "system", "note", "booking"],
            default: "system"
        }
    }],
    isArchived: { type: Boolean, default: false }
}, { 
    timestamps: true 
});

// Indexes for faster lookups
LeadSchema.index({ phone: 1, builderId: 1 });
LeadSchema.index({ email: 1, builderId: 1 });
LeadSchema.index({ phone: 1, accountId: 1 });
LeadSchema.index({ email: 1, accountId: 1 });
// Compound indexes for enterprise analytics and robust filtering
LeadSchema.index({ status: 1, assignee: 1, isArchived: 1 });
LeadSchema.index({ builderId: 1, createdAt: -1, isArchived: 1 });
LeadSchema.index({ accountId: 1, createdAt: -1, isArchived: 1 });
LeadSchema.index({ mandateId: 1, createdAt: -1, isArchived: 1 });
LeadSchema.index({ source: 1, isArchived: 1 });

// Avoid re-compiling the model if it already exists
const Lead = mongoose.models.Lead || mongoose.model("Lead", LeadSchema);

export default Lead;
