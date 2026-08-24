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
    offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
        index: true
    },
    requirement: { type: String },
    budget: { type: String },
    assignee: { type: String },
    leadType: {
        type: String,
        enum: ["normal", "token-hold", "group-buying", "specific-doubt"],
        default: "normal",
        index: true
    },
    loginStatus: {
        type: String,
        enum: ["authenticated", "guest"],
        default: "guest",
        index: true
    },
    visitorId: {
        type: String,
        index: true
    },
    isTokenPaid: { type: Boolean, default: false },
    tokenAmount: { type: Number, default: 0 },
    paymentId: { type: String, index: true },
    orderId: { type: String, index: true },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    unitId: { type: String, index: true },
    unitNumber: { type: String },
    holdId: { type: String, index: true },
    holdExpiresAt: { type: Date },
    interestedUnit: { type: String },
    hierarchyContext: {
        level: { type: String },
        propertyId: { type: String },
        propertyTitle: { type: String },
        townshipId: { type: String },
        townshipTitle: { type: String },
        projectId: { type: String },
        projectTitle: { type: String },
        towerId: { type: String },
        towerTitle: { type: String },
        unitId: { type: String },
        unitNumber: { type: String }
    },
    isGroup: { type: Boolean, default: false },
    groupSize: { type: Number, default: 0 },
    groupDiscount: { type: String },
    mergedMembers: [mongoose.Schema.Types.Mixed],
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

// Avoid schema caching issues in Next.js dev mode
delete mongoose.models.Lead;
const Lead = mongoose.model("Lead", LeadSchema);

export default Lead;
