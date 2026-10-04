import mongoose, { Schema, Document, Model, Connection } from 'mongoose';

export interface IFeedback extends Document {
  name: string;
  email: string;
  query: string;
  message?: string;
  source: 'visitor' | 'builder' | 'mandate';
  status: 'new' | 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  user?: mongoose.Types.ObjectId;
  userModel?: string;
  feedbackType?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const FeedbackSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    query: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    source: { 
      type: String, 
      enum: ['visitor', 'builder', 'mandate'], 
      default: 'builder' 
    },
    status: { 
      type: String, 
      enum: ['new', 'Open', 'In Progress', 'Resolved', 'Closed'], 
      default: 'new' 
    },
    user: { type: Schema.Types.ObjectId, required: false },
    userModel: { type: String, required: false },
    feedbackType: { type: String, default: 'General' },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

FeedbackSchema.pre('save', function () {
  if (!this.message && this.query) {
    this.message = this.query;
  }
});

export function getFeedbackModel(conn: Connection): Model<IFeedback> {
  return conn.models.Feedback || conn.model<IFeedback>('Feedback', FeedbackSchema, 'feedbacks');
}

const Feedback: Model<IFeedback> = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema, 'feedbacks');

export default Feedback;
