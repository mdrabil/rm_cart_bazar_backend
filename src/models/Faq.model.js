import mongoose from "mongoose";

const faqItemSchema = new mongoose.Schema(
  {
    mrFaqId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      minlength: [5, "Question must be at least 5 characters"],
      maxlength: [300, "Question cannot exceed 300 characters"],
    },

    answer: {
      type: String,
      required: [true, "Answer is required"],
      minlength: [5, "Answer must be at least 5 characters"],
    },
  },
  {
    timestamps: true,
  }
);

const faqSchema = new mongoose.Schema(
  {
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [70, "SEO title cannot exceed 70 characters"],
    },

    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
    },

    pageTitle: {
      type: String,
      required: [true, "Page title is required"],
      trim: true,
      minlength: [3, "Page title must be at least 3 characters"],
    },

    pageDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Page description cannot exceed 500 characters"],
    },

    faqs: [faqItemSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Faq || mongoose.model("Faq", faqSchema);