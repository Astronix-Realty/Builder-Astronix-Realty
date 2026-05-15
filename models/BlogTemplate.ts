import mongoose from "mongoose";

const BlockTemplateSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'hero', 'faq', 'text'
  defaultData: { type: mongoose.Schema.Types.Mixed } // The default structure to insert
}, { _id: false });

const BlogTemplateSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  description: { 
    type: String 
  },
  previewImage: {
    type: String
  },
  blocks: [BlockTemplateSchema],
  category: { type: String, default: "Uncategorized" }
}, {
  timestamps: true
});

const BlogTemplate = mongoose.models.BlogTemplate || mongoose.model("BlogTemplate", BlogTemplateSchema);

export default BlogTemplate;
