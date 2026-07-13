// models/Store.js
import mongoose from "mongoose";
import { STORE_OWNERSHIP_MODEL, STORE_STATUS, VARIFICATION_TYPE } from "../constants/enums.js";
import { generateMRId } from "../utils/mrId.js";

const storeSchema = new mongoose.Schema(
  {
    mrStoreId: {
      type: String,
      unique: true,
      index: true,
    
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    storeName: {
      type: String,
      required: true,
      index: true
    },

supportNumber: {
  type: String,
  trim: true,
  default: ""
},

fssaiNumber: {
  type: String,
  default: ""
},

   address: {
  fullAddress: String,
  city: String,
  state: String,
  pincode: String,

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  }
},


    gstDetails: {
      gstNumber: String,
      cgst: Number,
      sgst: Number
    },

    timing: {
      openTime: String,
      closeTime: String
    },

    status: {
      type: String,
      enum: Object.values(STORE_STATUS),
      default: STORE_STATUS.ACTIVE
    },
    // Or replace with boolean
isActive: {
  type: Boolean,
  default: true
},

        // models/Store.js (important part only)
commissionConfig: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "CommissionConfig",
  required: false,
default:null
},


verificationStatus:  {
      type: String,
      enum: Object.values(VARIFICATION_TYPE),
      default: VARIFICATION_TYPE.PENDING
    },

   
 ownershipModel: {
  type: String,
  enum: Object.values(STORE_OWNERSHIP_MODEL),
  default:STORE_OWNERSHIP_MODEL.COCO
}

  },
  { timestamps: true }
);


storeSchema.pre("save", async function (next) {
  if (!this.mrStoreId) {
    this.mrStoreId = await generateMRId("STR","STORE");
  }
  next();
});


storeSchema.index({ storeName: 1, owner: 1 }, { unique: true });

storeSchema.index({ "address.location": "2dsphere" });

export default mongoose.model("Store", storeSchema);
