// models/Cart.model.js

import mongoose from "mongoose";
import { PRODUCT_AREAS } from "../constants/enums.js";

// ─────────────────────────────────────────────
// LAYER SCHEMA
// ─────────────────────────────────────────────

const layerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      index: true,
    },

    type: {
      type: String,
      enum: ["text"],
      default: "text",
      required: true,
    },

    area: {
      type: String,
      enum: PRODUCT_AREAS,
      required: true,
    },

    text: {
      type: String,
      default: "",
      trim: true,
    },

    textMaxLength: {
      type: Number,
      default: 30,
      min: 1,
      max: 50,
    },

    fontSizePercent: {
      type: Number,
      default: 4,
      min: 0.5,
      max: 10,
    },

    textWidthPercent: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },

    color: {
      type: String,
      default: "#ffffff",
    },

    fontFamily: {
      type: String,
      default: "Arial",
    },

    bold: {
      type: Boolean,
      default: false,
    },

    curved: {
      type: Boolean,
      default: false,
    },

    curveRadius: {
      type: Number,
      default: 120,
      min: 40,
      max: 300,
    },

    xPercent: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    yPercent: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    rotation: {
      type: Number,
      default: 0,
      min: -180,
      max: 180,
    },

    image: {
      url: {
        type: String,
        default: null,
      },

      public_id: {
        type: String,
        default: null,
      },
    },
  },
  {
    _id: false,
  }
);

// ─────────────────────────────────────────────
// CART ITEM
// ─────────────────────────────────────────────

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

    // ✅ DIRECT LAYER
    layer: {
      type: layerSchema,
      default: null,
    },
  },
  {
    _id: false,
  }
);


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
  {
    timestamps: true,
  }
);

cartSchema.index({ customerId: 1 });

export default mongoose.model("Cart", cartSchema);