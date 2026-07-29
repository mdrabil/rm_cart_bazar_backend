import mongoose from "mongoose";

export const SHIPMENT_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  BOOKED: "BOOKED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  RTO: "RTO",
});

export const PICKUP_SOURCE = Object.freeze({
  STORE: "store",
  MANUAL: "manual",
  PROVIDER: "provider",
  SAVED_LOCATION: "saved_location",
});

const geoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },
  { _id: false }
);

const pickupSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: Object.values(PICKUP_SOURCE),
      default: PICKUP_SOURCE.MANUAL,
    },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store",default: null },
    mrStoreId: String,
    locationId: String,
    providerPickupId: String,
    name: String,
    phone: String,
    email: String,
    fullAddress: String,
    addressLine: String,
    addressLine2: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" },
    latitude: Number,
    longitude: Number,
    location: geoPointSchema,
  },
  { _id: false }
);

const receiverSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
  },
  { _id: false }
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    fullAddress: String,
    addressLine: String,
    addressLine2: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" },
    latitude: Number,
    longitude: Number,
    location: geoPointSchema,
  },
  { _id: false }
);

const dimensionsSchema = new mongoose.Schema(
  {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: "cm" },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    mrShipmentId: {
      type: String,
      unique: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    providerName: {
      type: String,
      required: true,
      index: true,
    },

    providerGatewayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingGateway",
    },

    status: {
      type: String,
      enum: Object.values(SHIPMENT_STATUS),
      default: SHIPMENT_STATUS.PENDING,
      index: true,
    },

    awb: { type: String, index: true },
    trackingNumber: String,
    providerShipmentId: String,
    courierName: String,

    /** Historical snapshot — never mutated by later Store/Order edits */
    pickupLocation: pickupSchema,
    receiver: receiverSchema,
    deliveryAddress: deliveryAddressSchema,

    weight: { type: Number, min: 0 },
    weightUnit: { type: String, default: "kg" },
    dimensions: dimensionsSchema,
    packageCount: { type: Number, default: 1, min: 1 },

    shippingCharges: { type: Number, default: 0, min: 0 },
    codAmount: { type: Number, default: 0, min: 0 },
    notes: String,

    labelUrl: String,
    manifestUrl: String,
    invoiceUrl: String,

    providerResponse: mongoose.Schema.Types.Mixed,
    trackingHistory: [
      {
        status: String,
        message: String,
        location: String,
        timestamp: Date,
        raw: mongoose.Schema.Types.Mixed,
      },
    ],

    statusTimeline: {
      createdAt: { type: Date, default: Date.now },
      bookedAt: Date,
      pickedUpAt: Date,
      inTransitAt: Date,
      outForDeliveryAt: Date,
      deliveredAt: Date,
      cancelledAt: Date,
      failedAt: Date,
    },

    lastTrackedAt: Date,
    bookingError: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

shipmentSchema.index({ orderId: 1, createdAt: -1 });

export default mongoose.model("Shipment", shipmentSchema);
