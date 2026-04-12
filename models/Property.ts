import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  type: 'township' | 'project' | 'tower';
  flowType: 'township' | 'project' | 'tower'; // Entry-point flow (determines hierarchy mode)
  parentId: mongoose.Types.ObjectId | null;
  builderId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  location: { city?: string; state?: string; address?: string };
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  isActive: boolean;
  rejectionReason: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: mongoose.Types.ObjectId | null;
  details: Record<string, any>;
  isDeleted: boolean;
  lastSavedStep: number;        // Last wizard step user was on
  autoSaveVersion: number;      // Increments on each auto-save
  publishedId: mongoose.Types.ObjectId | null;  // For drafts: linked published record
  draftId: mongoose.Types.ObjectId | null;      // For published: linked draft record
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>({
  type: { type: String, enum: ['township', 'project', 'tower'], required: true },
  // flowType: The entry-point flow. Defaults to the entity's own type (safe for standalone flows).
  // The API always sends this explicitly; the default is a last-resort safety net.
  flowType: {
    type: String,
    enum: ['township', 'project', 'tower'],
    required: true,
    default: function (this: any) { return this.type },
  },
  parentId: { type: Schema.Types.ObjectId, ref: 'Property', default: null },
  builderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, required: true },
  location: { city: String, state: String, address: String },
  status: { type: String, enum: ['draft', 'pending', 'published', 'rejected', 'archived'], default: 'draft' },
  isActive: { type: Boolean, default: false },
  rejectionReason: { type: String, default: null },
  submittedAt: { type: Date, default: null },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  details: { type: Schema.Types.Mixed, default: {} },
  isDeleted: { type: Boolean, default: false },
  lastSavedStep: { type: Number, default: 1 },
  autoSaveVersion: { type: Number, default: 0 },
  publishedId: { type: Schema.Types.ObjectId, ref: 'Property', default: null },
  draftId: { type: Schema.Types.ObjectId, ref: 'Property', default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true 
});

// Indexing Strategy
PropertySchema.index({ builderId: 1 });
PropertySchema.index({ parentId: 1 });
PropertySchema.index({ builderId: 1, type: 1 });
PropertySchema.index({ builderId: 1, publishedId: 1, status: 1 });
PropertySchema.index({ publishedId: 1 });
PropertySchema.index({ draftId: 1 });

// Pre-save hook for hierarchy validation
PropertySchema.pre('save', async function (next) {
  const property = this as IProperty;

  // Township: must have no parent
  if (property.type === 'township') {
    if (property.parentId !== null) {
      return next(new Error('Validation Error: A township must have a null parentId.'));
    }
    return next();
  }

  // Standalone flows (project or tower started without a parent in the hierarchy)
  // Allow null parentId only when flowType matches a standalone entry point
  const isStandaloneProject = property.type === 'project' && property.flowType === 'project';
  const isStandaloneTower   = property.type === 'tower'   && (property.flowType === 'tower' || property.flowType === 'project');

  if (!property.parentId) {
    if (isStandaloneProject || isStandaloneTower) {
      return next(); // Allowed — standalone flow
    }
    return next(new Error(`Validation Error: A ${property.type} must have a valid parentId in a full hierarchy flow.`));
  }

  // Has a parentId — validate it
  const parent = await mongoose.model('Property').findById(property.parentId);
  if (!parent || parent.isDeleted) {
    return next(new Error('Validation Error: Parent property does not exist or is deleted.'));
  }

  // Enforce Hierarchy Rules
  if (property.type === 'project' && parent.type !== 'township') {
    return next(new Error('Hierarchy Error: A project must be the child of a township.'));
  }
  if (property.type === 'tower' && parent.type !== 'project') {
    return next(new Error('Hierarchy Error: A tower must be the child of a project.'));
  }

  // Enforce Ownership Continuity
  if (parent.builderId.toString() !== property.builderId.toString()) {
    return next(new Error('Ownership Error: Child property must have the same builderId as its parent.'));
  }

  next();
});

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);
