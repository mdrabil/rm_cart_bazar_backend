// models/Job.js
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {

    mrJobId:{ type: String, unique: true, index: true },

    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    description: {
      type: String,
      required: [true, "Job description is required"],
      minlength: [10, "Description must be at least 10 characters"],
    },

    // ✅ Salary as STRING (like "5 LPA - 8 LPA", "Negotiable")
    salary: {
      type: String,
      trim: true,
      default: "Not disclosed",
    },

    requirements: [
      {
        type: String,
        trim: true,
      },
    ],

    jobCreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Job creator is required"],
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },

    appliedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
  },
  {
    timestamps: true,
  }
);


// ✅ INDEXING (Performance Boost)
jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: -1 });


// ✅ Custom Validation: End Date must be greater than Start Date
jobSchema.pre("save", function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error("End date must be greater than start date"));
  }

  // ✅ Auto close job if expired
  if (this.endDate < new Date()) {
    this.status = "closed";
  }

  next();
});


// ✅ Virtual: Check if job is active
jobSchema.virtual("isActive").get(function () {
  return this.status === "open" && this.endDate > new Date();
});


export default mongoose.models.Job || mongoose.model("Job", jobSchema);