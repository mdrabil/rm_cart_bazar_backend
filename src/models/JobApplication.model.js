import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
        mrAppliedJobId:{ type: String, unique: true, index: true },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
    },

    shortDesc: {
      type: String,
    },

    resume: {
      url: String,
      public_id: String,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ jobId: 1, email: 1 }, { unique: true });

export default mongoose.model("JobApplication", jobApplicationSchema);