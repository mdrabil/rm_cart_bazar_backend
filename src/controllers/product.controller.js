import Product from "../models/Product.model.js";
import Store from "../models/Store.model.js";
import Joi from "joi";
import { USER_ROLE, PRODUCT_STATUS } from "../constants/enums.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { generateProductSlug } from "../utils/rmId.js";
import { buildStoreFilter } from "../utils/accessHelper.js";

// 🔹 Joi Validation Schemas
const createProductSchema = Joi.object({
  store: Joi.string().required(),
  name: Joi.string().required(),
  category: Joi.string().required(),
  subCategory: Joi.string().optional(),
  description: Joi.string().allow(""),
  shortDesc: Joi.string().allow(""),
  label: Joi.string().optional(),
  variants: Joi.array().items(
    Joi.object({
      value: Joi.string().required(),
      mrp: Joi.number().positive(),
      sellingPrice: Joi.number().positive().required(),
      stockQty: Joi.number().integer().min(0),
    })
  ).min(1).required(),
  attributes: Joi.object().optional(),
  gstPercent: Joi.number().optional(),
  status: Joi.string().valid(...Object.values(PRODUCT_STATUS)).default(PRODUCT_STATUS.ACTIVE),
});

const updateProductSchema = Joi.object({
  name: Joi.string(),
  store: Joi.string(),
  category: Joi.string(),
  totalReviews: Joi.number().min(0).optional(),
averageRating: Joi.number().min(0).max(5).optional(),
  subCategory: Joi.string().allow("", null),
  description: Joi.string().allow(""),
  shortDesc: Joi.string().allow(""),
  label: Joi.string(),
  variants: Joi.array().items(
    Joi.object({
      _id: Joi.string().optional(),
      value: Joi.string().required(),
      mrp: Joi.number().positive(),
      sellingPrice: Joi.number().positive().required(),
      stockQty: Joi.number().integer().min(0),
      isActive: Joi.boolean()
    })
  ),
  attributes: Joi.object(),
  deletedImageIds:Joi.array(),
  deletedThumbnailIds:Joi.array(),
  gstPercent: Joi.number(),
  status: Joi.string().valid(...Object.values(PRODUCT_STATUS)),
}).min(1);





export const createProduct = async (req, res) => {
  try {
    
if(!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {

      const store = await Store.findById(product.store);

      if (req.user.roles.includes(USER_ROLE.VENDOR)) {
        if (store.owner.toString() !== req.user._id.toString())
          return res.status(403).json({ message: "Access denied" });
      }

      if (
        [USER_ROLE.STORE_MANAGER, USER_ROLE.CHEF].some(r =>
          req.user.roles.includes(r)
        )
      ) {
        if (req.staffRoleStoreId.toString() !== store._id.toString())
          return res.status(403).json({ message: "Access denied" });
      }
    }
    // 🔥 Parse variants (FormData case)
if (req.body.variants && typeof req.body.variants === "string") {
  req.body.variants = JSON.parse(req.body.variants);
}


    const { error, value } = createProductSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // 🔹 Store check
    const store = await Store.findById(value.store);
    if (!store) return res.status(404).json({ message: "Store not found" });

    // 🔹 Duplicate check
    const duplicate = await Product.findOne({ store: value.store, name: value.name });
    if (duplicate)
      return res.status(400).json({ message: "Product already exists in this store" });

 let slug = await generateProductSlug(value.name);

// 🔥 extra safety: agar slug already exist kare
let existingSlug = await Product.findOne({ slug });

if (existingSlug) {
  // 👇 fallback (timestamp based unique)
  slug = `${slug}-${Date.now()}`;
}
    // ✅ STEP 1: Create product FIRST (without images)
    const product = await Product.create({
      ...value,
      images: [],
      slug,
      thumbnails: [],
      createdBy: req.user._id,
    });

    let imageUrls = [];
    let thumbnailUrls = [];

    // ✅ STEP 2: Upload images AFTER product created
    if (req.files) {

      // Images
      if (req.files.images) {
        for (const file of req.files.images) {
          const uploaded = await cloudinary.uploader.upload_stream(
            { folder: "products" },
            async (error, result) => {}
          );
        }
      }

      // 🔥 Because we use memoryStorage, we must use buffer upload:

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

      if (req.files.images) {
        for (const file of req.files.images) {
          const result = await uploadToCloudinary(file, "products");
         imageUrls.push({
  url: result.secure_url,
  public_id: result.public_id
});
        }
      }

      if (req.files.thumbnails) {
        for (const file of req.files.thumbnails) {
          const result = await uploadToCloudinary(file, "thumbnails");
          thumbnailUrls.push({
  url: result.secure_url,
  public_id: result.public_id
});
        }
      }
    }

    // ✅ STEP 3: Update product with images
    product.images = imageUrls;
    product.thumbnails = thumbnailUrls;
    await product.save();

    res.status(201).json({ success: true, product });

  } catch (err) {
    console.error("createProduct:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- UPDATE PRODUCT -------------------
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // 🔥 Parse JSON fields safely
    if (req.body.variants && typeof req.body.variants === "string") {
      req.body.variants = JSON.parse(req.body.variants);
    }

    if (req.body.deletedImageIds && typeof req.body.deletedImageIds === "string") {
      req.body.deletedImageIds = JSON.parse(req.body.deletedImageIds);
    }

    if (req.body.deletedThumbnailIds && typeof req.body.deletedThumbnailIds === "string") {
      req.body.deletedThumbnailIds = JSON.parse(req.body.deletedThumbnailIds);
    }

    const { deletedImageIds = [], deletedThumbnailIds = [] } = req.body;

    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    // 🔐 ROLE VALIDATION
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      const store = await Store.findById(product.store);

      if (req.user.roles.includes(USER_ROLE.VENDOR)) {
        if (store.owner.toString() !== req.user._id.toString())
          return res.status(403).json({ message: "Access denied" });
      }

      if (
        [USER_ROLE.STORE_MANAGER, USER_ROLE.CHEF].some(r =>
          req.user.roles.includes(r)
        )
      ) {
        if (req.staffRoleStoreId.toString() !== store._id.toString())
          return res.status(403).json({ message: "Access denied" });
      }
    }

    // 🔹 Duplicate name check
    if (value.name && value.name !== product.name) {
      const duplicate = await Product.findOne({
        store: product.store,
        name: value.name,
        _id: { $ne: productId },
      });

      if (duplicate) {
        return res.status(400).json({
          message: "Product with same name already exists in this store",
        });
      }
    }

    // 🔥 Cloudinary Upload Helper
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

    // ==============================
    // 🗑 DELETE SELECTED IMAGES ONLY
    // ==============================

    if (deletedImageIds.length > 0) {
      await Promise.all(
        deletedImageIds.map(id =>
          cloudinary.uploader.destroy(id)
        )
      );

      product.images = product.images.filter(
        img => !deletedImageIds.includes(img.public_id)
      );
    }

    if (deletedThumbnailIds.length > 0) {
      await Promise.all(
        deletedThumbnailIds.map(id =>
          cloudinary.uploader.destroy(id)
        )
      );

      product.thumbnails = product.thumbnails.filter(
        img => !deletedThumbnailIds.includes(img.public_id)
      );
    }

    // ==============================
    // 📤 ADD NEW IMAGES (KEEP OLD)
    // ==============================

    if (!product.slug) {
  let newSlug = await generateProductSlug(value.name || product.name);

  // 🔥 safety check (rare case)
  const existingSlug = await Product.findOne({
    slug: newSlug,
    _id: { $ne: product._id },
  });

  if (existingSlug) {
    newSlug = `${newSlug}-${Date.now()}`;
  }

  product.slug = newSlug;
}

    if (req.files?.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file, "products");

        product.images.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    if (req.files?.thumbnails) {
      for (const file of req.files.thumbnails) {
        const result = await uploadToCloudinary(file, "thumbnails");

        product.thumbnails.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    // ==============================
    // 🔄 UPDATE OTHER FIELDS
    // ==============================
if (
  !value.subCategory ||
  value.subCategory === "" ||
  value.subCategory === "null"
) {
  value.subCategory = null;
}

if (
  !value.category ||
  value.category === "" ||
  value.category === "null"
) {
  value.category = null;
}
    Object.assign(product, value);

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });

  } catch (err) {
    console.error("updateProduct:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ------------------- DELETE PRODUCT -------------------
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    // 🔐 ROLE VALIDATION
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {

      const store = await Store.findById(product.store);

      if (req.user.roles.includes(USER_ROLE.VENDOR)) {
        if (store.owner.toString() !== req.user._id.toString())
          return res.status(403).json({ message: "Access denied" });
      }

      if (
        [USER_ROLE.STORE_MANAGER, USER_ROLE.CHEF].some(r =>
          req.user.roles.includes(r)
        )
      ) {
        if (req.staffRoleStoreId.toString() !== store._id.toString())
          return res.status(403).json({ message: "Access denied" });
      }
    }

    // 🔥 Delete images from Cloudinary
    await Promise.all([
      ...product.images.map(img =>
        cloudinary.uploader.destroy(img.public_id)
      ),
      ...product.thumbnails.map(img =>
        cloudinary.uploader.destroy(img.public_id)
      )
    ]);

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (err) {
    console.error("deleteProduct:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// 🔹 GET PRODUCT BY ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate('store').populate('category').populate("subCategory").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });


    res.json({ success: true, product });
  } catch (err) {
    console.error("getProductById:", err);
    res.status(500).json({ message: "Server error" });
  }
};



export const updateProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    // ✅ Validate status
    if (!Object.values(PRODUCT_STATUS).includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 🔐 ROLE VALIDATION
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      const store = await Store.findById(product.store);

      if (req.user.roles.includes(USER_ROLE.VENDOR)) {
        if (store.owner.toString() !== req.user._id.toString())
          return res.status(403).json({ message: "Access denied" });
      }

      if (
        [USER_ROLE.STORE_MANAGER, USER_ROLE.CHEF].some(r =>
          req.user.roles.includes(r)
        )
      ) {
        if (req.staffRoleStoreId.toString() !== store._id.toString())
          return res.status(403).json({ message: "Access denied" });
      }
    }

    // ✅ Update status only
    product.status = status;
    await product.save();

    res.json({
      success: true,
      message: "Product status updated successfully",
      product,
    });
  } catch (err) {
    console.error("updateProductStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};




export const getAllProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      store,
      category,
      status,
      name,
      search
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    // 🔹 NORMAL FILTERS
    const filter = {};

    // console.log("req.query",req.query)
    // console.log("req.body",req.body)

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (name) filter.name = { $regex: name, $options: "i" };

    // 🔍 SEARCH
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // 🔥 ACCESS FILTER (MAIN PART)
    const accessFilter = await buildStoreFilter(req.user, {
      field: "store",
      storeId: store // 👈 optional
    });

    // ✅ FINAL FILTER
    const finalFilter = {
      ...filter,
      ...accessFilter
    };

    // ✅ TOTAL COUNT
    const total = await Product.countDocuments(finalFilter);

    // ✅ DATA
    const products = await Product.find(finalFilter)
       .populate("store", "storeName rmStoreId")
      .populate("category", "name")
      .populate("subCategory", "name")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      total,
      page,
      limit,
      products
    });

  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// 🔹 DELETE PRODUCT
// export const deleteProduct = async (req, res) => {
//   try {
//     const { productId } = req.params;
//     const product = await Product.findById(productId);
//     if (!product) return res.status(404).json({ message: "Product not found" });


//     await product.deleteOne();
//     res.json({ success: true, message: "Product deleted successfully" });
//   } catch (err) {
//     console.error("deleteProduct:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
