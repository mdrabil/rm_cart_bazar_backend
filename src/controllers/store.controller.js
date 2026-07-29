import Store from "../models/Store.model.js";
import Joi from "joi";
import { STAFF_USER_ROLE, STATUS, STORE_STATUS, USER_ROLE } from "../constants/enums.js";
import StoreStaffModel from "../models/StoreStaff.model.js";
import { buildStoreFilter } from "../utils/accessHelper.js";
import UserModel from "../models/User.model.js";

// Joi validation schemas
// Joi validation schema
const createStoreSchema = Joi.object({
  storeName: Joi.string().trim().required().messages({
    "string.empty": "Store name is required",
    "any.required": "Store name is required",
  }),
  supportNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow("")
    .optional()
    .messages({
      "string.pattern.base": "Support number must be a valid 10-digit number",
    }),
  fssaiNumber: Joi.string().allow("").optional(),
  owner: Joi.string().optional(),
  status: Joi.string().valid("ACTIVE", "INACTIVE", "SUSPENDED"),
  address: Joi.object({
    fullAddress: Joi.string().trim().min(5).required().messages({
      "string.empty": "Full address is required",
      "string.min": "Full address is too short",
      "any.required": "Full address is required",
    }),
    city: Joi.string().trim().required().messages({
      "string.empty": "City is required",
      "any.required": "City is required",
    }),
    state: Joi.string().trim().required().messages({
      "string.empty": "State is required",
      "any.required": "State is required",
    }),
    pincode: Joi.string()
      .trim()
      .pattern(/^\d{5,6}$/)
      .required()
      .messages({
        "string.empty": "Pincode is required",
        "string.pattern.base": "Pincode must be 5 or 6 digits",
        "any.required": "Pincode is required",
      }),
    location: Joi.object({
      type: Joi.string().valid("Point").required(),
      coordinates: Joi.array()
        .ordered(
          Joi.number().min(-180).max(180).required().messages({
            "any.required": "Longitude is required",
            "number.base": "Longitude must be a valid number",
            "number.min": "Longitude must be between -180 and 180",
            "number.max": "Longitude must be between -180 and 180",
          }),
          Joi.number().min(-90).max(90).required().messages({
            "any.required": "Latitude is required",
            "number.base": "Latitude must be a valid number",
            "number.min": "Latitude must be between -90 and 90",
            "number.max": "Latitude must be between -90 and 90",
          })
        )
        .length(2)
        .required()
        .custom((coords, helpers) => {
          const [lng, lat] = coords;
          if (lng === 0 && lat === 0) {
            return helpers.message(
              "Latitude and longitude are required. Search or pick the store location on the map."
            );
          }
          return coords;
        }),
    })
      .required()
      .messages({
        "any.required": "Store location (latitude/longitude) is required",
      }),
  })
    .required()
    .messages({
      "any.required": "Address is required",
    }),
  gstDetails: Joi.object({
    gstNumber: Joi.string().allow(""),
    cgst: Joi.number().min(0),
    sgst: Joi.number().min(0),
  }),
  timing: Joi.object({
    openTime: Joi.string(),
    closeTime: Joi.string(),
  }),
  commissionConfig: Joi.string().allow(null),
  isActive: Joi.boolean().optional(),
});


const updateStoreSchema = Joi.object({
  storeName: Joi.string().trim(),
  supportNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow("")
    .optional()
    .messages({
      "string.pattern.base": "Support number must be a valid 10-digit number",
    }),
  fssaiNumber: Joi.string().allow("").optional(),
  owner: Joi.string().optional(),
  address: Joi.object({
    fullAddress: Joi.string().trim().min(5).messages({
      "string.empty": "Full address is required",
      "string.min": "Full address is too short",
    }),
    city: Joi.string().trim().messages({
      "string.empty": "City is required",
    }),
    state: Joi.string().trim().messages({
      "string.empty": "State is required",
    }),
    pincode: Joi.string()
      .trim()
      .pattern(/^\d{5,6}$/)
      .messages({
        "string.empty": "Pincode is required",
        "string.pattern.base": "Pincode must be 5 or 6 digits",
      }),
    location: Joi.object({
      type: Joi.string().valid("Point"),
      coordinates: Joi.array()
        .ordered(
          Joi.number().min(-180).max(180).required(),
          Joi.number().min(-90).max(90).required()
        )
        .length(2)
        .custom((coords, helpers) => {
          const [lng, lat] = coords;
          if (lng === 0 && lat === 0) {
            return helpers.message(
              "Latitude and longitude are required. Search or pick the store location on the map."
            );
          }
          return coords;
        }),
    }),
  }),
  verificationStatus: Joi.string()
    .valid("PENDING", "ON_HOLD", "APPROVED", "REJECTED")
    .optional(),
  gstDetails: Joi.object({
    gstNumber: Joi.string().allow(""),
    cgst: Joi.number().min(0),
    sgst: Joi.number().min(0),
  }),
  timing: Joi.object({
    openTime: Joi.string(),
    closeTime: Joi.string(),
  }),
  status: Joi.string().valid("ACTIVE", "INACTIVE", "SUSPENDED"),
  isActive: Joi.boolean().optional(),
}).min(1);

// List stores
const storeListSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  search: Joi.string().allow("").optional(),
  owner: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(STORE_STATUS)).optional(),
});



// 🔹 Schema for update only
const updateStoreSchemaOnly = Joi.object({
  timing: Joi.object({
    openTime: Joi.string().required(),
    closeTime: Joi.string().required(),
  }).optional(),
  isActive: Joi.boolean().optional(),
  status: Joi.string().valid("ACTIVE", "INACTIVE").optional(),
});

// export const updateStoreOnly = async (req, res) => {
//   try {
//     const { error, value } = updateStoreSchemaOnly.validate(req.body);
//     const storeId = req.params.id
//     if (error) return res.status(400).json({ message: error.details[0].message });

//     const store = await Store.findById(storeId);
//     if (!store) return res.status(404).json({ message: "Store not found" });

  

//     // Update fields
//     if (value.timing) store.timing = value.timing;
//     if (value.isActive !== undefined) store.isActive = value.isActive;
//     if (value.status) store.status = value.status;

//     await store.save();
//     res.status(200).json({ success: true, store, message: "Store updated successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };


export const updateStoreOnly = async (req, res) => {
  try {
    const { error, value } = updateStoreSchemaOnly.validate(req.body);

    const storeId = req.params.id;

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    // timing
    if (value.timing) {
      store.timing = value.timing;
    }

    // isActive
    if (value.isActive !== undefined) {
      store.isActive = value.isActive;

      // auto status update
   store.status = value.isActive
  ? STORE_STATUS.ACTIVE
  : STORE_STATUS.INACTIVE;
    }

    // manual status update (optional)
    if (value.status) {
      store.status = value.status;
    }

    await store.save();

    res.status(200).json({
      success: true,
      store,
      message: "Store updated successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};


export const createStore = async (req, res) => {
  try {

    
    const { error, value } = createStoreSchema.validate(req.body, {
      abortEarly: true,
      errors: { wrap: { label: false } },
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path.join("."),
      });
    }

    
    let ownerId;
    
    // 👑 SUPER ADMIN
    if (req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      ownerId = value.owner ? value?.owner : req.user._id;

      if (!ownerId) {
        return res.status(400).json({
          message: "Owner is required for Super Admin"
        });
      }
      
      // ✅ check user exist
      const userExists = await UserModel.findById(ownerId);
      if (!userExists) {
        return res.status(404).json({
          message: "Owner user not found"
        });
      }
    } 
    // 👤 NORMAL USER
    else {
      ownerId = req.user._id;
    }

    // 🔐 security: owner remove from payload

    delete value.owner;
    const normalizedName = value.storeName.trim().toLowerCase();

    // 🚫 duplicate check
  const existing = await Store.findOne({
  storeName: normalizedName,
  owner: ownerId
});

    if (existing) {
      return res.status(400).json({
        message: "Store already exists for this owner"
      });
    }

    
    // ✅ create store
    const store = await Store.create({
      ...value,
      owner: ownerId
    });

    // ✅ add in StoreStaff
    await StoreStaffModel.create({
      store: store._id,
      user: ownerId,
      role: STAFF_USER_ROLE.OWNER,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: "Store created successfully",
      store
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message
    });
  }
};

// 🔹 Update Store
export const updateStore = async (req, res) => {
  try {
    const { storeId } = req.params;

   console.log("req.body",req.body)
    const { error, value } = updateStoreSchema.validate(req.body, {
      abortEarly: true,
      errors: { wrap: { label: false } },
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path.join("."),
      });
    }

    const normalizedName = value.storeName.trim().toLowerCase();


    // Duplicate check on name if changing
    if (value.storeName) {
      const duplicate = await Store.findOne({
        storeName: normalizedName,
        owner: req.user._id,
        _id: { $ne: storeId }
      });
      if (duplicate) return res.status(400).json({ message: "Store name already exists" });
    }

    const store = await Store.findByIdAndUpdate(storeId, value, { new: true });
    if (!store) return res.status(404).json({ message: "Store not found" });

    res.json({ success: true, store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Get Store by ID
// export const getStoreById = async (req, res) => {
//   try {
//     const { storeId } = req.params;

//     const store = await Store.findById(storeId);
//     if (!store) return res.status(404).json({ message: "Store not found" });
//     const roles = req.user.roles;
//     // SUPER_ADMIN can access all, VENDOR / MANAGER only own store
//     if (!roles.includes(USER_ROLE.SUPER_ADMIN) && !store.owner.equals(req.user._id)) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     res.json({ success: true, store });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


export const getStoreById = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId)
      .populate({
        path: "owner",
        select: "fullName mobile email dp"
      });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found"
      });
    }

    const roles = req.user.roles;

    // SUPER_ADMIN can access all
    // VENDOR / MANAGER only own store
    if (
      !roles.includes(USER_ROLE.SUPER_ADMIN) &&
      !store.owner?._id.equals(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.json({
      success: true,
      store
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// export const getAllStores = async (req, res) => {
//   try {
//     const { error, value } = storeListSchema.validate(req.query);
//     if (error)
//       return res.status(400).json({ success: false, message: error.details[0].message });

//     const { page = 1, limit = 8, search, owner, status } = value;

//     let filter = {};
//     if (search) filter.storeName = { $regex: search, $options: "i" };
//     if (owner) filter.owner = owner;
//     if (status) filter.status = status;

//     // ✅ Check roles properly
//     const roles = req.user.roles.map(r => String(r.name));
//     let storesQuery;

//     if (roles.includes(USER_ROLE.SUPER_ADMIN)) {
//       storesQuery = Store.find(filter);
//     } else if (roles.includes(USER_ROLE.VENDOR)) {
//       storesQuery = Store.find({ owner: req.user._id, ...filter });
//     } else {
//       return res.status(403).json({ success: false, message: "Access denied" });
//     }

//     const total = await Store.countDocuments(filter);

//     const stores = await storesQuery
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       message: "Stores fetched successfully",
//       total,
//       page,
//       limit,
//       stores,
//     });
//   } catch (err) {
//     console.error("getAllStores error:", err);
//     res.status(500).json({ success: false, message: "Server error. Try again later." });
//   }
// };



// 🔹 Delete Store

export const getAllStores = async (req, res) => {
  try {
    let { page = 1, limit = 8, search, status } = req.query;

    page = Number(page);
    limit = Number(limit);

    // 🔹 NORMAL FILTER
    const filter = {};

    if (search) {
      filter.storeName = { $regex: search, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }
    // 🔥 ACCESS FILTER (ONLY THIS)
    const accessFilter = await buildStoreFilter(req.user, {
      field: "_id",
      storeId: req.query.store // optional
    });

    // ✅ MERGE
    const finalFilter = {
      ...filter,
      ...accessFilter
    };
    
    // console.log("get the data from frotnend ",finalFilter)
    const total = await Store.countDocuments(finalFilter);
   

    const stores = await Store.find(finalFilter)
      .populate("owner", "fullName email phone")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      total,
      page,
      limit,
      stores,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// export const getAllStores = async (req, res) => {
//   try {
//     const { error, value } = storeListSchema.validate(req.query);
//     if (error)
//       return res.status(400).json({ success: false, message: error.details[0].message });

//     const { page = 1, limit = 8, search, owner, status } = value;

//     // Base filter
//     let filter = {};
//     if (search) filter.storeName = { $regex: search, $options: "i" };
//     if (status) filter.status = status;

//     // Role check
//     const roles = req.user.roles.map(r => String(r.name));
//     let storesQuery;

//     if (roles.includes(USER_ROLE.SUPER_ADMIN)) {
//       // Super Admin -> all stores
//       if (owner) filter.owner = owner;
//       storesQuery = Store.find(filter).populate({
//         path: "owner",
//         select: "name email phone",
//       });
//     } else if (roles.includes(USER_ROLE.VENDOR)) {
//       // Vendor -> only assigned stores via StoreStaff
//       const assignedStaff = await StoreStaff.find({ user: req.user._id }).select("store");
//       const storeIds = assignedStaff.map(s => s.store.toString());

//       // Vendor has no stores assigned
//       if (storeIds.length === 0) {
//         return res.json({ success: true, message: "No stores assigned", total: 0, page, limit, stores: [] });
//       }

//       filter._id = { $in: storeIds };
//       storesQuery = Store.find(filter).populate({
//         path: "owner",
//         select: "name email phone",
//       });
//     } else {
//       return res.status(403).json({ success: false, message: "Access denied" });
//     }

//     const total = await Store.countDocuments(filter);

//     const stores = await storesQuery
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       message: "Stores fetched successfully",
//       total,
//       page,
//       limit,
//       stores,
//     });
//   } catch (err) {
//     console.error("getAllStores error:", err);
//     res.status(500).json({ success: false, message: "Server error. Try again later." });
//   }
// };



// DELETE STORE
export const deleteStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    const userId = req.user._id;
    const userRoles = req.user.roles;

    console.log('get roles',req.user.roles)

    // 1️⃣ Find store
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ success: false, message: "Store not found" });

    // 2️⃣ Super Admin can delete any store
    if (userRoles.includes(USER_ROLE.SUPER_ADMIN)) {
      await store.deleteOne();
      return res.json({ success: true, message: "Store deleted successfully" });
    }

    // 3️⃣ Vendor / Manager → check if user is owner OR assigned in StoreStaff
    let canDelete = false;

    // Vendor who owns the store
    if (store.owner.toString() === userId.toString()) canDelete = true;

    // OR assigned in StoreStaff
    const staff = await StoreStaff.findOne({ store: storeId, user: userId });
    if (staff) canDelete = true;

    if (!canDelete) {
      return res.status(403).json({ success: false, message: "Access denied. You cannot delete this store." });
    }

    // 4️⃣ Delete
    await store.deleteOne();
    res.json({ success: true, message: "Store deleted successfully" });
    
  } catch (err) {
    console.error("deleteStore error:", err);
    res.status(500).json({ success: false, message: "Server error. Try again later." });
  }
};
