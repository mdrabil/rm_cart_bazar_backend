// import mongoose from "mongoose";

// const cartItemSchema = new mongoose.Schema(
//   {
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },

//     variantId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//     },

//     qty: {
//       type: Number,
//       default: 1,
//       min: 1,
//     },
//   },
//   { _id: false }
// );

// const cartSchema = new mongoose.Schema(
//   {
//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//       unique: true,
//       index: true,
//     },

//     items: [cartItemSchema],
//   },
//   { timestamps: true }
// );

// cartSchema.index({ customer: 1 });

// export default mongoose.model("Cart", cartSchema);

import mongoose from "mongoose";

// ─── Customization sub-schemas ─────────────────────────────────────────────

const customizationLayerSchema = new mongoose.Schema(
  {
    id: { type: String },
    type: { type: String, enum: ["text", "image"] },
    area: { type: String },
    // text layer fields
    text: { type: String, default: "" },
    color: { type: String, default: "#000000" },
    // image layer fields
    imageUrl: { type: String, default: "" },
  },
  { _id: false }
);

const customizationSchema = new mongoose.Schema(
  {
    areas: [{ type: String }],
    layers: {
      type: Map,
      of: [customizationLayerSchema],
    },
  },
  { _id: false }
);

// ─── Cart item schema ──────────────────────────────────────────────────────

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    qty: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Optional: stores customer's customization choices
    customization: {
      type: customizationSchema,
      default: null,
    },
  },
  { _id: false }
);

// ─── Cart schema ───────────────────────────────────────────────────────────

const cartSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.index({ customerId: 1 });

export default mongoose.model("Cart", cartSchema);