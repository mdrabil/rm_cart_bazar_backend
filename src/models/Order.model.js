

import mongoose from "mongoose";

import { ORDER_STATUS, PRODUCT_AREAS } from "../constants/enums.js";

// ─────────────────────────────────────────────
// LAYER SCHEMA
// ─────────────────────────────────────────────

const layerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      index: true,
    },
    isCustomized: {
  type: Boolean,
  default: false,
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

const orderSchema = new mongoose.Schema(
  {
    mrOrderId: { type: String, unique: true, index: true },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    reason: String,

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },

        variantId: {
          type: mongoose.Schema.Types.ObjectId,
        },

        productName: String,

        variantLabel: String,

        sellingPrice: Number,

        qty: Number,

        gstPercent: Number,

        // ✅ CUSTOMIZE DATA
        layer: {
          type: layerSchema,
          default: null,
        },
      },
    ],

    totalAmount: Number,

    gstAmount: Number,

    discountAmount: {
      type: Number,
      default: 0,
    },

    payableAmount: Number,

    couponCode: String,

    // ✅ Payment
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE", "UPI", "WALLET","CARD","PAYTM","PHONEPE","GPAY","CASHFREE","RAZORPAY","INSTAMOJO","PAYNOW","PAYTM","PHONEPE","GPAY","BANKTRANSFER"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    transactionId: String, // actual transaction id from payment gateway

    
    paymentModuleId: String, // payment order id from payment Id

    // ✅ Delivery
    deliveryDate: Date,

    notes: String,

    deliverySlot: String,

    deliveryAddress: {
      fullAddress: String,

      addressLine: String,

      city: String,

      state: String,

      pincode: String,

      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },

        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },

    deliveryMeta: {
      distanceKm: {
        type: Number,
        default: 0,
      },

      assignedStoreType: String,
    },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
      index: true,
    },

    orderSource: {
      type: String,
      enum: ["website", "app"],
      default: "website",
      index: true,
    },

    // ✅ Status Timeline
    statusTimeline: {
      placedAt: {
        type: Date,
        default: Date.now,
      },

      acceptedAt: Date,

      preparingAt: Date,

      readyAt: Date,

      outForDeliveryAt: Date,

      deliveredAt: Date,

      cancelledAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "store.storeId": 1, status: 1 });

export default mongoose.model("Order", orderSchema);




