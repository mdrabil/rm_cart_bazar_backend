// models/counter.model.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // name of the sequence, e.g., "STORE"
    seq: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Counter", counterSchema);
