// Product.model.js
import mongoose from "mongoose";

import {
  PRODUCT_AREAS,
  PRODUCT_STATUS,
  USER_ROLE,
} from "../constants/enums.js";

import { generateRMId } from "../utils/rmId.js";




const layerSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────

    id: {
      type:  String,
      index: true,
      // uuid generated on the frontend (stable across edits)
    },

    type: {
      type:     String,
      enum:     ["text"],   // "image" layer type reserved for future
      default:  "text",
      required: true,
    },

    area: {
      type:     String,
      enum:     PRODUCT_AREAS,
      required: true,
    },

    // ── Text properties ───────────────────────────────────────────────────────

    text: {
      type:    String,
      default: "",
      trim:    true,
    },

    // Maximum characters the customer is allowed to input for this area.
    textMaxLength: {
      type:    Number,
      default: 50,
      min:     1,
      max:     500,
    },

    fontSizePercent: {
      type:    Number,
      default: 3,       // fontSize = (fontSizePercent / 100) * canvasWidth
      min:     0.5,
      max:     50,
    },


    textWidthPercent: {
      type:    Number,
      default: 80,
      min:     0,
      max:     100,
    },

    color: {
      type:    String,
      default: "#ffffff",
    },

    fontFamily: {
      type:    String,
      default: "Arial",
    },

    bold: {
      type:    Boolean,
      default: false,
    },

    curved: {
      type:    Boolean,
      default: false,
    },

    curveRadius: {
      type:    Number,
      default: 120,
      min:     40,
      max:     300,
    },

    // ── Position (percentage-based, resolution-independent) ──────────────────

    xPercent: {
      type:    Number,
      default: 50,    // centre of canvas
      min:     0,
      max:     100,
    },

    yPercent: {
      type:    Number,
      default: 50,
      min:     0,
      max:     100,
    },

    rotation: {
      type:    Number,
      default: 0,      // degrees, -180 → 180
      min:    -180,
      max:     180,
    },

    // ── Image (reserved for future "image" layer type) ────────────────────────
    // Stored inside the layer so one area = one layer always.

    image: {
      url:       { type: String, default: null },
      public_id: { type: String, default: null },
    },
  },
  { _id: false }  // use the custom `id` string field, not Mongo ObjectId
);

// ─────────────────────────────────────────────────────────────────────────────
// Customization sub-schema
// ─────────────────────────────────────────────────────────────────────────────

const customizationSchema = new mongoose.Schema(
  {
    enabled: {
      type:    Boolean,
      default: false,
    },

    // Which areas the vendor has enabled (mirrors layer areas, kept explicit
    // so the frontend can restore UI state without scanning layers).
    selectedAreas: {
      type:    [String],
      enum:    PRODUCT_AREAS,
      default: [],
    },

    // One layer per selected area. Enforced by the pre-save hook below.
    layers: {
      type:    [layerSchema],
      default: [],
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// Product schema
// ─────────────────────────────────────────────────────────────────────────────

const productSchema = new mongoose.Schema(
  {
    rmProductId: {
      type:   String,
      unique: true,
      index:  true,
    },

    store: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Store",
      required: true,
      index:    true,
    },

    category: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Category",
      required: true,
      index:    true,
    },

    subCategory: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Category",
      default: null,
    },

    name: {
      type:     String,
      required: true,
      trim:     true,
    },

    slug: {
      type:   String,
      unique: true,
    },

    label: {
      type:     String,
      required: true,
      default:  "Size",
    },

    description: {
      type:    String,
      default: "",
    },
      shortDesc: {
      type:    String,
      default: "",
    },

    images: [
      {
        url:       String,
        public_id: String,
      },
    ],

    thumbnails: [
      {
        url:       String,
        public_id: String,
      },
    ],

    variants: [
      {
        value: {
          type:    String,
          default: "",
        },

        mrp: {
          type:     Number,
          required: true,
        },

        sellingPrice: {
          type:     Number,
          required: true,
        },

        stockQty: {
          type:    Number,
          default: 0,
        },
       isActive: { type: Boolean, default: true }
      },
    ],

    customization: {
      type:    customizationSchema,
      default: () => ({ enabled: false, selectedAreas: [], layers: [] }),
    },

    gstPercent: {
      type:    Number,
      default: 0,
    },

    status: {
      type:    String,
      enum:    Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
    },

    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    allowedCreatorRoles: {
      type:    [String],
      enum:    Object.values(USER_ROLE),
      default: [
        USER_ROLE.VENDOR,
        USER_ROLE.STORE_MANAGER,
        USER_ROLE.CHEF,
      ],
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Pre-save: auto-generate rmProductId
// ─────────────────────────────────────────────────────────────────────────────

productSchema.pre("save", async function (next) {
  try {
    if (!this.rmProductId) {
      this.rmProductId = await generateRMId("RMP", "PRODUCT");
    }
    next();
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Pre-save: enforce max one layer per area (last-write-wins)
// ─────────────────────────────────────────────────────────────────────────────

productSchema.pre("save", function (next) {
  if (!this.customization?.layers?.length) return next();

  const seen   = new Set();
  const unique = [];

  for (let i = this.customization.layers.length - 1; i >= 0; i--) {
    const area = this.customization.layers[i].area;
    if (!seen.has(area)) {
      seen.add(area);
      unique.unshift(this.customization.layers[i]);
    }
  }

  this.customization.layers = unique;
  next();
});

export default mongoose.model("Product", productSchema);