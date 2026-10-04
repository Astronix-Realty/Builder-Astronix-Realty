import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  userModel: 'User' | 'Builder';
  feedbackType: 'Glitch' | 'Problem' | 'Suggestion' | 'Other';
  message: string;
  attachments?: string[];
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, refPath: 'userModel' },
    userModel: { type: String, required: true, enum: ['User', 'Builder'] },
    feedbackType: { type: String, required: true, enum: ['Glitch', 'Problem', 'Suggestion', 'Other'] },
    message: { type: String, required: true },
    attachments: [{ type: String }],
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

const Feedback: Model<IFeedback> = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback;
