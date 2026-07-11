// import mongoose from "mongoose";
// import { CATEGORY_STATUS, USER_ROLE } from "../constants/enums.js";
// import { generateMRId } from "../utils/mrId.js";

// const categorySchema = new mongoose.Schema(
//   {
//     mrCategoryId: {
//       type: String,
//       unique: true,
//       index: true,
//       default: () => generateMRId("MRC")
//     },

//     name: {
//       type: String,
//       required: true,
//       index: true
//     },

//     description: String,

//     status: {
//       type: String,
//       enum: Object.values(CATEGORY_STATUS),
//       default: CATEGORY_STATUS.ACTIVE
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true
//     },

//     allowedCreatorRoles: {
//       type: [String],
//       enum: Object.values(USER_ROLE),
//       default: [USER_ROLE.SUPER_ADMIN]
//     }
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Category", categorySchema);





import mongoose from "mongoose";

import { CATEGORY_STATUS } from "../constants/enums.js";

const categorySchema = new mongoose.Schema(
  {
    mrCategoryId: {
      type: String,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    // ✅ CATEGORY IMAGE (OPTIONAL)
    image: { 
      url: String, 
      public_id: String 
    }, 

    status: {
      type: String,
      enum: Object.values(CATEGORY_STATUS),
      default: CATEGORY_STATUS.ACTIVE
    },

    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    }
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 });
categorySchema.index({ createdAt: -1 });

/* 🔥 UNIQUE CATEGORY UNDER SAME PARENT */
categorySchema.index(
  { name: 1, parentCategory: 1 },
  { unique: true }
);

export default mongoose.model("Category", categorySchema);