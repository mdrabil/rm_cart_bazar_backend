// controllers/product.controller.js

import Joi from "joi";

import Product from "../models/Product.model.js";
import Store from "../models/Store.model.js";

import {
  USER_ROLE,
  PRODUCT_STATUS,
} from "../constants/enums.js";

import cloudinary from "../config/cloudinaryConfig.js";

import {
  generateLayerId,
  generateProductSlug,
} from "../utils/rmId.js";

// =========================
// VALIDATION
// =========================

const createProductSchema = Joi.object({
  store: Joi.string().required(),
  name: Joi.string().required(),
  category: Joi.string().required(),
  subCategory: Joi.string().allow("", null),
  label: Joi.string().allow(""),
  description: Joi.string().allow(""),
  shortDescription: Joi.string().allow(""),
  brand: Joi.string().allow(""),
  material: Joi.string().allow(""),
  fitType: Joi.string().allow(""),
  variants: Joi.array()
    .items(
      Joi.object({
        value: Joi.string().allow(""),
        size: Joi.string().allow(""),
        color: Joi.string().allow(""),
        mrp: Joi.number().positive().required(),
        sellingPrice: Joi.number().positive().required(),
        stockQty: Joi.number().integer().min(0),
        sku: Joi.string().allow(""),
      })
    )
    .min(1)
    .required(),
  customization: Joi.object().optional(),
  gstPercent: Joi.number().optional(),
  areaImageKeys: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  status: Joi.string()
    .valid(...Object.values(PRODUCT_STATUS))
    .default(PRODUCT_STATUS.ACTIVE),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().optional(),
  store: Joi.string().optional(),
  category: Joi.string().allow("", null).optional(),
  subCategory: Joi.string().allow("", null).optional(),
  label: Joi.string().allow("", null).optional(),
  description: Joi.string().allow("", null).optional(),
  shortDescription: Joi.string().allow("", null).optional(),
  brand: Joi.string().allow("", null).optional(),
  material: Joi.string().allow("", null).optional(),
  fitType: Joi.string().allow("", null).optional(),
  totalReviews: Joi.number().min(0).optional(),
  averageRating: Joi.number().min(0).max(5).optional(),
  variants: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().optional(),
        value: Joi.string().allow("", null),
        size: Joi.string().allow("", null),
        color: Joi.string().allow("", null),
        mrp: Joi.number().positive(),
        sellingPrice: Joi.number().positive(),
        stockQty: Joi.number().integer().min(0),
        isActive: Joi.boolean().default(true),
        sku: Joi.string().allow("", null),
      })
    )
    .min(1)
    .optional(),
  customization: Joi.object().optional(),
  gstPercent: Joi.number().allow(null).optional(),
  areaKeys: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  status: Joi.string()
    .valid(...Object.values(PRODUCT_STATUS))
    .optional(),
  deletedImageIds: Joi.array().items(Joi.string()).optional(),
  deletedThumbnailIds: Joi.array().items(Joi.string()).optional(),
  deletedVariantIds: Joi.array().items(Joi.string()).optional(),
  // FIX #6: deletedAreaKeys added to schema
  deletedAreaKeys: Joi.array().items(Joi.string()).optional(),
});

// =========================
// CLOUDINARY UPLOAD HELPER
// =========================

const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
};

// =========================
// SAFE JSON PARSE
// =========================

const parseJSON = (val) => {
  if (!val) return undefined;
  if (typeof val === "string") return JSON.parse(val);
  return val;
};

// =========================
// AREAS ARRAY → OBJECT
// Converts ["front","back"] → { front:{enabled,width,height}, back:{...} }
// while preserving existing dimension config from DB
// =========================

const AREA_DEFAULTS = {
  front:      { width: 300, height: 300 },
  back:       { width: 300, height: 300 },
  leftSleeve: { width: 120, height: 120 },
  rightSleeve:{ width: 120, height: 120 },
  pocket:     { width: 100, height: 100 },
};

const areasArrayToObject = (areasArray, existingAreasObject = {}) => {
  const result = {};
  for (const key of areasArray) {
    result[key] = {
      enabled: true,
      ...(AREA_DEFAULTS[key] || { width: 300, height: 300 }),
      // Preserve any existing width/height the admin may have customised
      ...(existingAreasObject[key] || {}),
    };
  }
  return result;
};

// =========================
// CREATE PRODUCT
// =========================

export const createNewProduct = async (req, res) => {
  try {
    // ---- PARSE JSON ----
    if (req.body.variants && typeof req.body.variants === "string") {
      req.body.variants = JSON.parse(req.body.variants);
    }
    if (req.body.customization && typeof req.body.customization === "string") {
      req.body.customization = JSON.parse(req.body.customization);
    }

    // ---- VALIDATE ----
    const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // ---- STORE CHECK ----
    const store = await Store.findById(value.store);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    // ---- ACCESS CHECK ----
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      if (req.user.roles.includes(USER_ROLE.VENDOR)) {
        if (store.owner.toString() !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }
      if (
        [USER_ROLE.STORE_MANAGER, USER_ROLE.CHEF].some((r) =>
          req.user.roles.includes(r)
        )
      ) {
        if (req.staffRoleStoreId.toString() !== store._id.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }
    }

    // ---- DUPLICATE CHECK ----
    const duplicate = await Product.findOne({ store: value.store, name: value.name });
    if (duplicate) {
      return res.status(400).json({ success: false, message: "Product already exists" });
    }

    // ---- SLUG ----
    let slug = await generateProductSlug(value.name);
    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    // ---- CREATE PRODUCT ----
    const product = new Product({
      ...value,
      slug,
      createdBy: req.user._id,
      images: [],
      thumbnails: [],
    });

    // Auto-generate layer IDs on create
    if (value.customization?.layers?.length) {
      for (const layer of value.customization.layers) {
        if (!layer.id) layer.id = await generateLayerId();
      }
    }

    // ---- PRODUCT IMAGES ----
    if (req.files?.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file, "products");
        product.images.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    // ---- THUMBNAILS ----
    if (req.files?.thumbnails) {
      for (const file of req.files.thumbnails) {
        const result = await uploadToCloudinary(file, "thumbnails");
        product.thumbnails.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    // ---- CUSTOMIZATION ----
    if (value.customization) {
      product.customization = value.customization;
    }
    if (!product.customization) product.customization = {};
    if (!product.customization.areaImages) product.customization.areaImages = {};

    // ---- AREA IMAGES ----
    const uploadedAreaImages = req.files?.areaImages || [];
    let areaImageKeys = req.body.areaImageKeys || [];
    if (typeof areaImageKeys === "string") areaImageKeys = [areaImageKeys];

    for (let i = 0; i < uploadedAreaImages.length; i++) {
      const file = uploadedAreaImages[i];
      const area = areaImageKeys[i];
      if (!area) continue;
      const result = await uploadToCloudinary(file, `customization/${area}`);
      product.customization.areaImages[area] = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    // ---- LAYER IMAGE UPLOAD ----
    const layerFiles = req.files?.layerImages || [];
    let imageIndex = 0;
    if (product.customization?.layers?.length) {
      for (let i = 0; i < product.customization.layers.length; i++) {
        const layer = product.customization.layers[i];
        if (layer.type === "image") {
          const file = layerFiles[imageIndex];
          if (file) {
            const result = await uploadToCloudinary(file, "customization/layers");
            layer.image = { url: result.secure_url, public_id: result.public_id };
            imageIndex++;
          }
        }
      }
    }

    // ---- SAVE ----
    await product.save();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error("createNewProduct error", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

// =========================
// UPDATE PRODUCT
// =========================

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // ---- PARSE ALL JSON FIELDS ----
    const value = {
      ...req.body,
      variants:           parseJSON(req.body.variants),
      customization:      parseJSON(req.body.customization),
      deletedImageIds:    parseJSON(req.body.deletedImageIds)    || [],
      deletedThumbnailIds:parseJSON(req.body.deletedThumbnailIds)|| [],
      deletedVariantIds:  parseJSON(req.body.deletedVariantIds)  || [],
      // FIX #1 & #6: parse deletedAreaKeys sent by frontend when an area is unchecked
      deletedAreaKeys:    parseJSON(req.body.deletedAreaKeys)    || [],
      areaKeys:           parseJSON(req.body.areaKeys)           || [],
    };

    // ---- FETCH PRODUCT ----
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // ---- ACCESS CHECK ----
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      const store = await Store.findById(product.store);
      if (
        req.user.roles.includes(USER_ROLE.VENDOR) &&
        store.owner.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    // ---- CLOUDINARY BULK-DELETE HELPER ----
    const destroy = async (ids = []) => {
      if (!ids.length) return;
      await Promise.all(ids.map((id) => cloudinary.uploader.destroy(id)));
    };

    // =============================================
    // RULE 1 — PRODUCT IMAGES / THUMBNAILS
    // =============================================

    // Delete removed existing images
    if (value.deletedImageIds.length) {
      await destroy(value.deletedImageIds);
      product.images = product.images.filter(
        (img) => !value.deletedImageIds.includes(img.public_id)
      );
    }

    if (value.deletedThumbnailIds.length) {
      await destroy(value.deletedThumbnailIds);
      product.thumbnails = product.thumbnails.filter(
        (img) => !value.deletedThumbnailIds.includes(img.public_id)
      );
    }

    // Add new images
    if (req.files?.images?.length) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file, "products");
        product.images.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    if (req.files?.thumbnails?.length) {
      for (const file of req.files.thumbnails) {
        const result = await uploadToCloudinary(file, "thumbnails");
        product.thumbnails.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    // =============================================
    // RULE 3 — VARIANTS
    // =============================================

    if (value.variants) {
      // CASE B: filter explicitly deleted variants
      const survived = product.variants.filter(
        (v) => !value.deletedVariantIds.includes(v._id?.toString())
      );

      // CASE A: update existing variants (matched by _id)
      const updatedExisting = survived.map((old) => {
        const incoming = value.variants.find(
          (v) => v._id && v._id === old._id?.toString()
        );
        return incoming ? { ...old.toObject(), ...incoming } : old.toObject();
      });

      // FIX #3 — CASE C: push brand-new variants (those without an _id)
      const newVariants = value.variants.filter((v) => !v._id);

      product.variants = [...updatedExisting, ...newVariants];
    }

    // =============================================
    // RULE 2 — CUSTOMIZATION SAFE MERGE
    // =============================================

    if (value.customization !== undefined) {
      // const oldCustomization = product.customization?.toObject?.() || {};

      const oldCustomization = product.customization?.toObject?.() || {};

      // FIX #4 — Convert areas array ["front","back"] → proper DB object
      let areasObject = oldCustomization.areas || {};
      if (Array.isArray(value.customization.areas)) {
        areasObject = areasArrayToObject(
          value.customization.areas,
          oldCustomization.areas || {}
        );
      } else if (value.customization.areas && typeof value.customization.areas === "object") {
        // Already an object (edge case) — merge
        areasObject = { ...(oldCustomization.areas || {}), ...value.customization.areas };
      }

      // Merge: preserve existing areaImages, let area-image section handle changes
      product.customization = {
        ...oldCustomization,
        enabled: value.customization.enabled ?? oldCustomization.enabled,
        areas:   areasObject,
        // FIX #5 — layers come from the designer popup; replace fully if provided
        layers:  value.customization.layers ?? oldCustomization.layers,
        // Preserve existing areaImages — new uploads handled below
        areaImages: { ...(oldCustomization.areaImages || {}) },
      };
    }

    // =============================================
    // RULE 2 — CASE C: DELETED AREA KEYS
    // Delete Cloudinary image + remove from areaImages + remove from areas
    // =============================================

    // FIX #1 — handle deletedAreaKeys that arrive when user unchecks an area
    // if (value.deletedAreaKeys.length) {
    //   for (const areaKey of value.deletedAreaKeys) {
    //     // Delete from Cloudinary if public_id exists
    //     const existingImg = product.customization?.areaImages?.[areaKey];
    //     if (existingImg?.public_id) {
    //       await cloudinary.uploader.destroy(existingImg.public_id);
    //     }
    //     // Remove from areaImages
    //     if (product.customization?.areaImages) {
    //       delete product.customization.areaImages[areaKey];
    //     }
    //     // Remove from areas
    //     if (product.customization?.areas) {
    //       delete product.customization.areas[areaKey];
    //     }
    //   }
    //   // FIX #5 — tell Mongoose this nested object changed
    //   product.markModified("customization");
    // }



    // its work 2 

//     if (value.deletedAreaKeys.length) {
//   for (const areaKey of value.deletedAreaKeys) {

//     // 1. delete cloud image
//     const existingImg = product.customization?.areaImages?.[areaKey];
//     if (existingImg?.public_id) {
//       await cloudinary.uploader.destroy(existingImg.public_id);
//     }

//     // 2. remove areaImages
//     if (product.customization?.areaImages) {
//       delete product.customization.areaImages[areaKey];
//     }

//     // 3. remove area config
//     if (product.customization?.areas) {
//       delete product.customization.areas[areaKey];
//     }

//     // 🔥 IMPORTANT FIX — REMOVE LAYERS OF THAT AREA
//     if (product.customization?.layers?.length) {
//       product.customization.layers = product.customization.layers.filter(
//         (layer) => layer.area !== areaKey
//       );
//     }
//   }

//   // 🔥 force mongoose update
//   product.markModified("customization.areaImages");
//   product.markModified("customization.areas");
//   product.markModified("customization.layers");
// }

console.log("AREA IMAGES DB:", product.get("customization.areaImages"));
console.log("DELETING:", value.deletedAreaKeys);

if (value.deletedAreaKeys.length) {

  const areaImages = JSON.parse(
    JSON.stringify(product.customization?.areaImages || {})
  );

  for (const areaKey of value.deletedAreaKeys) {

    const img = areaImages[areaKey];

    if (img?.public_id) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    // safe remove
    delete areaImages[areaKey];
  }

  product.customization.areaImages = areaImages;

  // remove areas + layers safely
  for (const areaKey of value.deletedAreaKeys) {

    if (product.customization?.areas) {
      delete product.customization.areas[areaKey];
    }

    if (product.customization?.layers?.length) {
      product.customization.layers =
        product.customization.layers.filter(
          (l) => l.area !== areaKey
        );
    }
  }

  product.markModified("customization");
}

    // =============================================
    // RULE 2 — CASE A / B: AREA IMAGE UPLOADS
    // If old image exists for that area → delete first (Case B)
    // Then upload and save new image (Case A & B)
    // =============================================

    if (req.files?.areaImages?.length) {
      let areaKeys = value.areaKeys || [];
      if (!Array.isArray(areaKeys)) areaKeys = [areaKeys];

      for (let i = 0; i < req.files.areaImages.length; i++) {
        const file = req.files.areaImages[i];
        const key  = areaKeys[i];
        if (!key) continue;

        // FIX #2 — CASE B: delete the old Cloudinary image before uploading a new one
        const oldImg = product.customization?.areaImages?.[key];
        if (oldImg?.public_id) {
          await cloudinary.uploader.destroy(oldImg.public_id);
        }

        const result = await uploadToCloudinary(file, "customization");

        // Ensure nested path exists
        if (!product.customization) product.customization = {};
        if (!product.customization.areaImages) product.customization.areaImages = {};

        product.customization.areaImages[key] = {
          url:       result.secure_url,
          public_id: result.public_id,
        };
      }

      // FIX #5 — mark modified so Mongoose persists the nested change
      product.markModified("customization");
    }

    // =============================================
    // RULE 4 — CATEGORY / SUBCATEGORY
    // Empty string → null (avoid ObjectId cast error)
    // =============================================

    const parseObjectIdSafe = (val) => (!val || val === "" ? null : val);

    if (value.subCategory !== undefined) {
      product.subCategory = parseObjectIdSafe(value.subCategory);
    }
    if (value.category !== undefined) {
      product.category = parseObjectIdSafe(value.category);
    }

    // =============================================
    // RULE 5 — NORMAL SCALAR FIELDS
    // =============================================

    const scalarFields = [
      "name",
      "label",
      "description",
      "shortDescription",
      "brand",
      "material",
      "fitType",
      "gstPercent",
      "totalReviews",
      "averageRating",
      "status",
    ];

    for (const key of scalarFields) {
      if (value[key] !== undefined) {
        product[key] = value[key];
      }
    }

    // ---- SLUG — regenerate only when name changed ----
    if (value.name && value.name !== product.name) {
      let slug = await generateProductSlug(value.name);
      const exists = await Product.findOne({ slug, _id: { $ne: product._id } });
      product.slug = exists ? `${slug}-${Date.now()}` : slug;
    }

    // ---- SAVE ----
    await product.save();

    return res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    console.error("updateProduct error", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};
