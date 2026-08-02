import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sender: { type: String, enum: ["agent", "lead"], required: true },
  senderName: { type: String },
  readAt: { type: Date },
  attachments: [{ url: String, type: String }],
}, { timestamps: true });

const ConversationSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
    index: true,
  },
  builderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  role: {
    type: String,
    enum: ["builder", "mandate"],
    default: "builder",
    index: true,
  },
  mandateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mandate",
    index: true,
  },
  // Denormalized for fast list rendering
  leadName: { type: String },
  leadPhone: { type: String },
  assignee: { type: String },
  lastMessage: { type: String },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  messages: [MessageSchema],
}, { timestamps: true });

// Compound indexes for fast inbox loading
ConversationSchema.index({ builderId: 1, lastMessageAt: -1 });
ConversationSchema.index({ accountId: 1, lastMessageAt: -1 });
ConversationSchema.index({ mandateId: 1, lastMessageAt: -1 });
ConversationSchema.index({ role: 1 });
ConversationSchema.index({ leadId: 1 }, { unique: true });

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);

export default Conversation;
