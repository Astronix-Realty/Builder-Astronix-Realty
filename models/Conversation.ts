import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sender: { type: String, enum: ["agent", "lead", "buyer", "user"], required: true },
  senderId: { type: String },
  senderRole: { type: String, enum: ["builder", "mandate", "buyer", "agent", "support"], default: "buyer" },
  senderName: { type: String },
  readAt: { type: Date },
  attachments: [{ url: String, type: String }],
}, { timestamps: true });

const ParticipantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, enum: ["buyer", "builder", "mandate", "agent", "support"], default: "buyer" },
  name: { type: String },
  phone: { type: String },
  email: { type: String }
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
  conversationType: {
    type: String,
    enum: ["GROUP", "DIRECT", "SUPPORT"],
    default: "DIRECT",
    index: true,
  },
  conversationKey: {
    type: String,
    index: true,
  },
  groupPoolKey: {
    type: String,
    index: true,
  },
  poolRootPropertyId: {
    type: String,
  },
  poolRootPropertyName: {
    type: String,
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    index: true,
  },
  memberUserId: {
    type: String,
    index: true,
  },
  memberPhone: {
    type: String,
  },
  memberEmail: {
    type: String,
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
  participants: [ParticipantSchema],
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

// Compound indexes for fast inbox loading and deduplication
ConversationSchema.index({ builderId: 1, lastMessageAt: -1 });
ConversationSchema.index({ accountId: 1, lastMessageAt: -1 });
ConversationSchema.index({ mandateId: 1, lastMessageAt: -1 });
ConversationSchema.index({ role: 1 });
ConversationSchema.index({ groupPoolKey: 1, conversationType: 1 });
ConversationSchema.index({ conversationKey: 1 }, { sparse: true });
ConversationSchema.index({ memberUserId: 1, conversationType: 1 });

delete mongoose.models.Conversation;
const Conversation = mongoose.model("Conversation", ConversationSchema);

export default Conversation;

