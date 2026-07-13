import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    fullName: String,
    mobile: String,

    addressLine: String,
    city: String,
    state: String,
    pincode: String,

    latitude: Number,
    longitude: Number,

    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Address", addressSchema);
