// // models/StoreStaff.model.js
// import mongoose from "mongoose";
// import { STAFF_USER_ROLE } from "../constants/enums.js";
// import { generateMRId } from "../utils/mrId.js";

// const storeStaffSchema = new mongoose.Schema(
//   {
//     mrStaffId: { type: String, unique: true, index: true },

//   store: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Store",
//   required: true
// },


//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
  
//     },


 
//    role: { type: String, enum: Object.values(STAFF_USER_ROLE), unique: true },

//     isActive: { type: Boolean, default: true }
//   },
//   { timestamps: true }
// );

// // AUTO ID
// storeStaffSchema.pre("save", async function (next) {
//   if (!this.mrStaffId) {
//     this.mrStaffId = await generateMRId("MRSTF");
//   }
//   next();
// });

// // UNIQUE store + user
// storeStaffSchema.index(
//   { store: 1, user: 1, role: 1 },
//   { unique: true }
// );

// export default mongoose.model("StoreStaff", storeStaffSchema);



import mongoose from "mongoose";
import { STAFF_USER_ROLE } from "../constants/enums.js";
import { generateMRId } from "../utils/mrId.js";

const socialSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
  },
  { _id: false }
);


const storeStaffSchema = new mongoose.Schema(
  {
    mrStaffId: { type: String, unique: true, index: true },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: { 
      type: String, 
      enum: Object.values(STAFF_USER_ROLE),
      required: true,
    },
        socials: [socialSchema],

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

/* ================= AUTO GENERATE MRID ================= */

// For .save() / .create()
storeStaffSchema.pre("save", async function(next) {
  if (!this.mrStaffId) {
    this.mrStaffId = await generateMRId("MRSTF","STORE_STAFF");
  }
  next();
});

// For insertMany
storeStaffSchema.pre("insertMany", async function(next, docs) {
  for (let doc of docs) {
    if (!doc.mrStaffId) {
      doc.mrStaffId = await generateMRId("MRSTF","STORE_STAFF");
    }
  }
  next();
});

// For findOneAndUpdate with upsert
storeStaffSchema.pre("findOneAndUpdate", async function(next) {
  const update = this.getUpdate();
  if (update && !update.mrStaffId) {
    update.mrStaffId = await generateMRId("MRSTF","STORE_STAFF");
    this.setUpdate(update);
  }
  next();
});

/* ================= UNIQUE INDEX ================= */

// Unique combination of store + user + role
storeStaffSchema.index(
  { store: 1, user: 1, role: 1 },
  { unique: true }
);

export default mongoose.model("StoreStaff", storeStaffSchema);