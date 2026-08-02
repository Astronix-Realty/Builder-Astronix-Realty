import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  builderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
  title: { type: String, required: true },
  body: { type: String },
  type: {
    type: String,
    enum: ["lead_created", "lead_updated", "message_received", "system"],
    default: "system",
  },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ builderId: 1, isRead: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

export default Notification;
