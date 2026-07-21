import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    fullAddress: String,
    addressLine: String,

    mobile: String,
    city: String,
    type:String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
      location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    mrCustomerId: { type: String, unique: true, index: true },
logo:String,
    fullName: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    mobile: { type: String, unique: true, required: true },
           dp: {
  url: { type: String, default: null },
  public_id: { type: String, default: null },
},

    // password: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: "CUSTOMER" },

    // Verification status — set at signup from pre-create OTP sessions
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    phoneVerifiedAt: { type: Date, default: null },

    refreshToken: String,
    isBlocked: { type: Boolean, default: false },

    addresses: [addressSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);