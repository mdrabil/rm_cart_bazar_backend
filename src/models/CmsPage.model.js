import mongoose from "mongoose";

const cmsPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    type: {
      type: String,
      trim: true,
      lowercase: true,
      default: "page",
      index: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    metaTitle: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    metaDescription: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    content: {
      type: mongoose.Schema.Types.Mixed, // 🔥 flexible for contact object, html, etc
      required: [true, "Content is required"],
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);



/* 🔥 Fast Query Index */
cmsPageSchema.index({ slug: 1, status: 1 });

export default mongoose.models.CmsPage ||
  mongoose.model("CmsPage", cmsPageSchema);