import mongoose from "mongoose";

const languagePreferenceSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },
    languageType: {
      type: String,
      enum: ["English", "Hindi"],
      default: "English",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "LanguagePreference",
  languagePreferenceSchema
);
