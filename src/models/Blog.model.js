import mongoose from "mongoose";




const blogSchema = new mongoose.Schema({
  title: { type: String, required: [true, "Title required"], trim: true },
  mrBlogId:{ type: String, unique: true, index: true },
  slug: { type: String, unique: true },
  description: { type: String, required: [true, "Description required"], minlength: 50 },
  categories: {
    type: [],
    validate: {
      validator: (arr) => arr.length > 0,
      message: "At least one category is required",
    },
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tags: {
    type: [String],
    validate: {
      validator: (arr) => arr.length > 0,
      message: "At least one tag is required",
    },
  },
  image: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  thumbnail: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  seoTitle: { type: String, trim: true },
  seoDescription: { type: String, trim: true },
  isPublished: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ["draft", "published", "archived","on_hold"], // ✅ allowed values
    default: "draft",
  },

  comments: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BlogComment",
  },
],

}, { timestamps: true });



export default mongoose.model("Blog", blogSchema);