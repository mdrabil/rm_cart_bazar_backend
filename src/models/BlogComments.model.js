import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
    userName: { type: String, required: true, trim: true },
    userEmail: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    message: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 1000,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogComment",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BlogComment", commentSchema);