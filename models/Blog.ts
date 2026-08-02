import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const BlockSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  type: { type: String, required: true }, // 'hero', 'text', 'faq', 'pros-cons', 'gallery', 'cta', 'map'
  data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const SeoSchema = new mongoose.Schema({
  metaTitle: { type: String, trim: true, maxlength: 60 },
  metaDescription: { type: String, trim: true, maxlength: 160 },
  keywords: [String],
  ogImage: { type: String }
}, { _id: false });

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Blog title is required"],
    trim: true
  },
  slug: {
    type: String,
    required: [true, "Slug is required"],
    unique: true,
    trim: true,
    lowercase: true
  },
  previousSlugs: [String],
  excerpt: {
    type: String,
    trim: true
  },
  coverImage: {
    url: String,
    publicId: String,
    width: Number,
    height: Number,
    blurDataURL: String
  },
  category: {
    type: String,
    default: "Uncategorized"
  },
  readTime: {
    type: String,
    default: "5 min read"
  },
  authorName: { type: String },
  authorRole: { type: String },
  authorId: {
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
  builderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  mandateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mandate",
    index: true
  },
  
  // Advanced Modular Blocks
  blocks: [BlockSchema],

  // Dependency Graph
  linkedProperties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    index: true
  }],
  linkedLocality: { type: String },
  needsReview: { type: Boolean, default: false }, // Flagged when linked properties change

  // Health & SEO
  seo: SeoSchema,
  views: { type: Number, default: 0 },
  
  // State & Publishing
  status: {
    type: String,
    enum: ["draft", "published", "scheduled", "archived"],
    default: "draft",
    index: true
  },
  publishedAt: { type: Date },

  // Collaborative Locking
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  lockedAt: { type: Date },

  // Version History
  versions: [{
    contentSnapshots: [BlockSchema],
    savedAt: { type: Date, default: Date.now },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }]

}, {
  timestamps: true
});

// Indexes for faster lookups
BlogSchema.index({ status: 1, publishedAt: 1 });
BlogSchema.index({ previousSlugs: 1 });
BlogSchema.index({ accountId: 1 });
BlogSchema.index({ builderId: 1 });
BlogSchema.index({ mandateId: 1 });
BlogSchema.index({ role: 1 });

// Avoid re-compiling the model if it already exists
const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);

export default Blog;
