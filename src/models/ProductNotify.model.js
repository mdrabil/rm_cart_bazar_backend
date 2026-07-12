import mongoose from "mongoose";

const productNotifySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    variantId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Notified", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

productNotifySchema.index(
  {
    customer: 1,
    product: 1,
    variantId: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model("ProductNotify", productNotifySchema);