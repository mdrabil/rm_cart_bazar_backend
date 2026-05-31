// controllers/product.controller.js

import Joi from "joi";

import Product from "../models/Product.model.js";
import Store   from "../models/Store.model.js";

import {
  USER_ROLE,
  PRODUCT_STATUS,
} from "../constants/enums.js";

import cloudinary from "../config/cloudinaryConfig.js";

import { generateProductSlug } from "../utils/rmId.js";

// =============================================================================
// HELPERS
// =============================================================================

const parseJSON = (val) => {
  if (!val) return undefined;
  if (typeof val === "string") return JSON.parse(val);
  return val;
};

// =============================================================================
// VALIDATION SCHEMA (createProduct)
// =============================================================================

const createProductSchema = Joi.object({
  store:    Joi.string().required(),
  name:     Joi.string().required(),
  category: Joi.string().required(),

  subCategory:      Joi.string().allow("", null),
  label:            Joi.string().allow(""),
  description:      Joi.string().allow(""),
  shortDesc: Joi.string().allow(""),
  brand:            Joi.string().allow(""),
  material:         Joi.string().allow(""),
  fitType:          Joi.string().allow(""),

  variants: Joi.array()
    .items(
      Joi.object({
        value:        Joi.string().allow(""),
        size:         Joi.string().allow(""),
        color:        Joi.string().allow(""),
        mrp:          Joi.number().positive().required(),
        sellingPrice: Joi.number().positive().required(),
        stockQty:     Joi.number().integer().min(0),
        sku:          Joi.string().allow(""),
      })
    )
    .min(1)
    .required(),

  customization: Joi.object().optional(),
  gstPercent:    Joi.number().optional(),

  status: Joi.string()
    .valid(...Object.values(PRODUCT_STATUS))
    .default(PRODUCT_STATUS.ACTIVE),
});

// =============================================================================
// CLOUDINARY HELPER
// =============================================================================

const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });

// =============================================================================
// CREATE PRODUCT
// =============================================================================

export const createNewProduct = async (req, res) => {
  try {

    // ── Parse JSON fields from FormData ──────────────────────────────────────

    try {
      if (req.body.variants && typeof req.body.variants === "string") {
        req.body.variants = JSON.parse(req.body.variants);
      }
      if (req.body.customization && typeof req.body.customization === "string") {
        req.body.customization = JSON.parse(req.body.customization);
      }
    } catch {
      return res.status(400).json({ success: false, message: "Invalid JSON data" });
    }

const layerIdList = Array.isArray(req.body.layerIds)
  ? req.body.layerIds
  : req.body.layerIds
  ? [req.body.layerIds]
  : [];
delete req.body.layerIds; // remove before validate()

const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // ── Store check ───────────────────────────────────────────────────────────

    const store = await Store.findById(value.store);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    // ── Access check ──────────────────────────────────────────────────────────

    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      if (
        req.user.roles.includes(USER_ROLE.VENDOR) &&
        store.owner.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      if (
        [USER_ROLE.STORE_MANAGER, USER_ROLE.CHEF].some((r) =>
          req.user.roles.includes(r)
        ) &&
        req.staffRoleStoreId.toString() !== store._id.toString()
      ) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    // ── Duplicate check ───────────────────────────────────────────────────────

    const duplicate = await Product.findOne({ store: value.store, name: value.name });
    if (duplicate) {
      return res.status(400).json({ success: false, message: "Product already exists" });
    }

    // ── Slug ──────────────────────────────────────────────────────────────────

    let slug = await generateProductSlug(value.name);
    if (await Product.findOne({ slug })) {
      slug = `${slug}-${Date.now()}`;
    }

    // ── Create product ────────────────────────────────────────────────────────

    const product = new Product({
      ...value,
      slug,
      createdBy: req.user._id,
      images:    [],
      thumbnails: [],
    });

    // ── Product images ────────────────────────────────────────────────────────

    if (req.files?.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file, "products");
        product.images.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    // ── Thumbnails ────────────────────────────────────────────────────────────

    if (req.files?.thumbnails) {
      for (const file of req.files.thumbnails) {
        const result = await uploadToCloudinary(file, "thumbnails");
        product.thumbnails.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    // ── Customization ─────────────────────────────────────────────────────────

    if (value.customization) {
      product.customization = value.customization;
    }

    if (!product.customization) {
      product.customization = { enabled: false, selectedAreas: [], layers: [] };
    }

    // ── Layer image upload (create path) ──────────────────────────────────────
    // Build a map: layerId → file so we match by id (not by sequential index).

    if (product.customization?.layers?.length) {
      const layerFiles  = req.files?.layerImages || [];


      // Build id → file map
 const layerFileMap = {};
layerIdList.forEach((id, i) => {
  if (layerFiles[i]) layerFileMap[id] = layerFiles[i];
});
      for (const layer of product.customization.layers) {
        const file = layerFileMap[layer.id];
        if (file) {
          const result = await uploadToCloudinary(file, "customization/areas");
          layer.image = { url: result.secure_url, public_id: result.public_id };
        }
      }
    }

    // ── Save ──────────────────────────────────────────────────────────────────

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });

  } catch (err) {
    console.error("createNewProduct error", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// =============================================================================
// UPDATE PRODUCT
// =============================================================================

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // ── Parse JSON fields from FormData ──────────────────────────────────────

    const value = {
      ...req.body,
      variants:             parseJSON(req.body.variants),
      customization:        parseJSON(req.body.customization),
      deletedImageIds:      parseJSON(req.body.deletedImageIds)      || [],
      deletedThumbnailIds:  parseJSON(req.body.deletedThumbnailIds)  || [],
      deletedVariantIds:    parseJSON(req.body.deletedVariantIds)    || [],
      deletedLayerImageIds: parseJSON(req.body.deletedLayerImageIds) || [],
    };

    // ── Find product ──────────────────────────────────────────────────────────

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // ── Access check ──────────────────────────────────────────────────────────

    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      const store = await Store.findById(product.store);

      if (
        req.user.roles.includes(USER_ROLE.VENDOR) &&
        store.owner.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    // ── Cloudinary delete helper ──────────────────────────────────────────────

    const destroy = async (ids = []) => {
      if (!ids.length) return;
      await Promise.all(ids.map((id) => cloudinary.uploader.destroy(id)));
    };

    // ── Delete removed layer images (area unchecked or replaced) ─────────────

    if (value.deletedLayerImageIds.length) {
      await destroy(value.deletedLayerImageIds);
    }

    // ── Delete removed product images ─────────────────────────────────────────

    if (value.deletedImageIds.length) {
      await destroy(value.deletedImageIds);
      product.images = product.images.filter(
        (img) => !value.deletedImageIds.includes(img.public_id)
      );
    }

    // ── Delete removed thumbnails ─────────────────────────────────────────────

    if (value.deletedThumbnailIds.length) {
      await destroy(value.deletedThumbnailIds);
      product.thumbnails = product.thumbnails.filter(
        (img) => !value.deletedThumbnailIds.includes(img.public_id)
      );
    }

    // ── New product images ────────────────────────────────────────────────────

    if (req.files?.images?.length) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file, "products");
        product.images.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    // ── New thumbnails ────────────────────────────────────────────────────────

    if (req.files?.thumbnails?.length) {
      for (const file of req.files.thumbnails) {
        const result = await uploadToCloudinary(file, "thumbnails");
        product.thumbnails.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    // ── Variants ──────────────────────────────────────────────────────────────

    if (value.variants) {
      // Keep non-deleted
      const survived = product.variants.filter(
        (v) => !value.deletedVariantIds.includes(v._id?.toString())
      );

      // Update existing variants
      const updatedExisting = survived.map((old) => {
        const incoming = value.variants.find(
          (v) => v._id && v._id === old._id?.toString()
        );
        return incoming ? { ...old.toObject(), ...incoming } : old.toObject();
      });

      // Add new variants (no _id)
      const newVariants = value.variants.filter((v) => !v._id);

      product.variants = [...updatedExisting, ...newVariants];
    }

    // ── Customization ─────────────────────────────────────────────────────────

    if (value.customization) {
      const oldLayers = product.customization?.layers || [];
      const newLayers = value.customization.layers    || [];

      // Build a map: layerId → uploaded file.
      // Frontend sends layerImages + layerIds only for layers that have a new file,
      // so the arrays are parallel and matched by position.
      const layerFiles  = req.files?.layerImages || [];
      const layerIdList = Array.isArray(req.body.layerIds)
        ? req.body.layerIds
        : req.body.layerIds
        ? [req.body.layerIds]
        : [];

      const layerFileMap = {};
      layerIdList.forEach((id, i) => {
        if (layerFiles[i]) layerFileMap[id] = layerFiles[i];
      });

      // Process each new layer
      for (const newLayer of newLayers) {
        const oldLayer = oldLayers.find((l) => l.id === newLayer.id);
        const file     = layerFileMap[newLayer.id];

        if (file) {
          // REPLACE: delete old cloud image (if any) then upload new one
          // Note: old image was already queued in deletedLayerImageIds by the
          // frontend when imageFile was set, so destroy is handled above.
          // We still upload the new file here regardless.
          const result = await uploadToCloudinary(file, "customization/areas");
          newLayer.image = { url: result.secure_url, public_id: result.public_id };
        } else if (oldLayer?.image?.url) {
          // KEEP: no new file → restore the existing cloud image
          newLayer.image = oldLayer.image;
        }
        // else: no file and no old image → newLayer.image stays as sent (null/undefined)
      }

      // Delete cloud images of layers that were removed (area unchecked)
      // These should already be in deletedLayerImageIds, but guard just in case
      for (const oldLayer of oldLayers) {
        const stillExists = newLayers.some((l) => l.id === oldLayer.id);
        if (!stillExists && oldLayer?.image?.public_id) {
          // Only destroy if NOT already in the deletedLayerImageIds list
          if (!value.deletedLayerImageIds.includes(oldLayer.image.public_id)) {
            await cloudinary.uploader.destroy(oldLayer.image.public_id);
          }
        }
      }

      product.customization = {
        enabled:       value.customization.enabled       ?? false,
        selectedAreas: value.customization.selectedAreas || [],
        layers:        newLayers,
      };

      product.markModified("customization");
    }

    // ── Category / subCategory ────────────────────────────────────────────────

    const parseObjectIdSafe = (val) => (!val || val === "" ? null : val);

    if (value.category !== undefined) {
      product.category = parseObjectIdSafe(value.category);
    }
    if (value.subCategory !== undefined) {
      product.subCategory = parseObjectIdSafe(value.subCategory);
    }

    // ── Scalar fields ─────────────────────────────────────────────────────────

    const scalarFields = [
      "name", "label", "description", "shortDesc",
      "brand", "material", "fitType",
      "gstPercent", "totalReviews", "averageRating", "status",
    ];

    for (const key of scalarFields) {
      if (value[key] !== undefined) product[key] = value[key];
    }

    // ── Slug (only regenerate if name changed) ────────────────────────────────

    if (value.name && value.name !== product.name) {
      let slug = await generateProductSlug(value.name);
      const exists = await Product.findOne({ slug, _id: { $ne: product._id } });
      product.slug = exists ? `${slug}-${Date.now()}` : slug;
    }

    // ── Save ──────────────────────────────────────────────────────────────────

    await product.save();

    return res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });

  } catch (err) {
    console.error("updateProduct error", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};