import Category from "../models/Category.model.js";
import Joi from "joi";
import { USER_ROLE, CATEGORY_STATUS } from "../constants/enums.js";
import { generateMRId } from "../utils/mrId.js";
import cloudinary from "../config/cloudinaryConfig.js";
import mongoose from "mongoose";

// ------------------- Validation -------------------
const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  parentCategory: Joi.string().allow("", null), // allow empty string or null
  status: Joi.string().valid(...Object.values(CATEGORY_STATUS)).default(CATEGORY_STATUS.ACTIVE),
});


const updateCategorySchema = Joi.object({
  name: Joi.string(),
  parentCategory: Joi.string().allow("", null),
  status: Joi.string().valid(...Object.values(CATEGORY_STATUS)),
}).min(0); // allow empty object

// ------------------- CRUD -------------------

// 🔹 Create Category

export const createCategory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User Not Found" });
    }

    // ✅ Joi Validation
    const { error, value } = createCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    /* ===========================
       ✅ FIX PARENT CATEGORY
    ============================ */
    let parentCategory = null;

    if (
      value.parentCategory &&
      value.parentCategory !== "null" &&
      mongoose.Types.ObjectId.isValid(value.parentCategory)
    ) {
      parentCategory = value.parentCategory;
    }

    /* ===========================
       ✅ CHECK DUPLICATE
    ============================ */
    const duplicate = await Category.findOne({
      name: value.name,
      parentCategory: parentCategory
    });

    if (duplicate) {
      return res.status(400).json({
        message: "Category already exists under this parent"
      });
    }

    /* ===========================
       ✅ GENERATE CUSTOM ID
    ============================ */
    const mrCategoryId = await generateMRId("CAT", "CATEGORY");

    /* ===========================
       ✅ HANDLE IMAGE
    ============================ */
    let imageData = null;

    if (req.file) {
      imageData = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    /* ===========================
       ✅ CREATE CATEGORY
    ============================ */
    const category = await Category.create({
      name: value.name,
      parentCategory,
      status: value.status,
      mrCategoryId,
      image: imageData,
      createdBy: userId
    });

    return res.status(201).json({
      success: true,
      category
    });

  } catch (err) {
    console.error("createCategory:", err);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

// 🔹 Update Category
// export const updateCategory = async (req, res) => {
//   try {
//     const { categoryId } = req.params;

//     // Validate text fields only
//     const { error, value } = updateCategorySchema.validate(req.body);
//     if (error) return res.status(400).json({ message: error.details[0].message });

//     const category = await Category.findById(categoryId);
//     if (!category) return res.status(404).json({ message: "Category not found" });

//     // Only SUPER_ADMIN or creator can update
//     if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN) && category.createdBy.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     // Handle image update
//     if (req.file) {
//       if (category.image && category.image.public_id) {
//         await cloudinary.uploader.destroy(category.image.public_id);
//       }
//       category.image = { url: req.file.path, public_id: req.file.filename };
//     }

//     // Assign other fields if provided
//     if (Object.keys(value).length > 0) {
//       Object.assign(category, value);
//     }

//     await category.save();

//     res.json({ success: true, category });
//   } catch (err) {
//     console.error("updateCategory:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, parentCategory: incomingParent, status } = req.body;

    /* ===========================
       ✅ FIX PARENT CATEGORY
    ============================ */
    let parentCategory = null;

    if (incomingParent && incomingParent !== "null" && mongoose.Types.ObjectId.isValid(incomingParent)) {
      parentCategory = incomingParent;
    }

    /* ===========================
       ✅ CHECK DUPLICATE
    ============================ */
    const duplicate = await Category.findOne({
      _id: { $ne: categoryId },
      name,
      parentCategory
    });

    if (duplicate) {
      return res.status(400).json({ message: "Category already exists under this parent" });
    }

    /* ===========================
       ✅ HANDLE IMAGE
    ============================ */
    let updateData = { name, parentCategory, status };

    if (req.file) {
      updateData.image = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    /* ===========================
       ✅ UPDATE CATEGORY
    ============================ */
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ success: true, category: updatedCategory });

  } catch (err) {
    console.error("updateCategory:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
// 🔹 Get All Categories (with pagination + search + status filter)
export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const status = req.query.status;
    const search = req.query.search;

    const filter = {};
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: "i" };

    const total = await Category.countDocuments(filter);
    const categories = await Category.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, total, page, limit, categories });
  } catch (err) {
    console.error("getAllCategories:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get single Category
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, category });
  } catch (err) {
    console.error("getCategoryById:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN) && category.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete image from Cloudinary
    if (category.image && category.image.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id);
    }

    await category.deleteOne();
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("deleteCategory:", err);
    res.status(500).json({ message: "Server error" });
  }
};