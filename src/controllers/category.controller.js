import Category from "../models/Category.model.js";
import Joi from "joi";
import { USER_ROLE, CATEGORY_STATUS } from "../constants/enums.js";
import { generateMRId } from "../utils/mrId.js";
import cloudinary from "../config/cloudinaryConfig.js";
import mongoose from "mongoose";

const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  parentCategory: Joi.string().allow("", null),
  status: Joi.string().valid(...Object.values(CATEGORY_STATUS)).default(CATEGORY_STATUS.ACTIVE),
});

function normalizeParentId(value) {
  if (!value || value === "null" || value === "undefined") return null;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return value;
}

/** Walk ancestors of parentId; true if categoryId appears (cycle) or self-parent. */
async function wouldCreateCycle(categoryId, parentId) {
  if (!parentId) return false;
  if (categoryId && String(categoryId) === String(parentId)) return true;

  let current = await Category.findById(parentId).select("parentCategory");
  const visited = new Set();

  while (current) {
    const id = String(current._id);
    if (categoryId && id === String(categoryId)) return true;
    if (visited.has(id)) return true;
    visited.add(id);
    if (!current.parentCategory) break;
    current = await Category.findById(current.parentCategory).select("parentCategory");
  }
  return false;
}

function buildTree(categories) {
  const map = new Map();
  categories.forEach((cat) => {
    const obj = cat.toObject ? cat.toObject() : { ...cat };
    map.set(String(obj._id), { ...obj, children: [] });
  });

  const roots = [];
  map.forEach((node) => {
    const parentId = node.parentCategory
      ? String(node.parentCategory._id || node.parentCategory)
      : null;
    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

export const createCategory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User Not Found" });
    }

    const { error, value } = createCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const parentCategory = normalizeParentId(value.parentCategory);

    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(400).json({ message: "Parent category not found" });
      }
    }

    const duplicate = await Category.findOne({
      name: value.name,
      parentCategory,
    });
    if (duplicate) {
      return res.status(400).json({
        message: "Category already exists under this parent",
      });
    }

    const mrCategoryId = await generateMRId("CAT", "CATEGORY");

    let imageData = null;
    if (req.file) {
      imageData = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    const category = await Category.create({
      name: value.name,
      parentCategory,
      status: value.status,
      mrCategoryId,
      image: imageData,
      createdBy: userId,
    });

    return res.status(201).json({
      success: true,
      category,
    });
  } catch (err) {
    console.error("createCategory:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, parentCategory: incomingParent, status } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const parentCategory = normalizeParentId(incomingParent);

    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(400).json({ message: "Parent category not found" });
      }
      if (await wouldCreateCycle(categoryId, parentCategory)) {
        return res.status(400).json({
          message: "Invalid parent — this would create a circular category relationship",
        });
      }
    }

    const duplicate = await Category.findOne({
      _id: { $ne: categoryId },
      name: name || category.name,
      parentCategory,
    });
    if (duplicate) {
      return res.status(400).json({ message: "Category already exists under this parent" });
    }

    const updateData = {
      name: name ?? category.name,
      parentCategory,
      status: status ?? category.status,
    };

    if (req.file) {
      if (category.image?.public_id) {
        try {
          await cloudinary.uploader.destroy(category.image.public_id);
        } catch {
          /* ignore */
        }
      }
      updateData.image = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    const updatedCategory = await Category.findByIdAndUpdate(categoryId, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({ success: true, category: updatedCategory });
  } catch (err) {
    console.error("updateCategory:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const status = req.query.status;
    const search = req.query.search;
    const tree = req.query.tree === "true" || req.query.tree === "1";
    const all = req.query.all === "true" || req.query.all === "1" || tree;

    const filter = {};
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: "i" };

    if (all) {
      const categories = await Category.find(filter)
        .populate("parentCategory", "name mrCategoryId")
        .sort({ name: 1 });

      const payload = {
        success: true,
        total: categories.length,
        categories,
      };

      if (tree) {
        payload.tree = buildTree(categories);
      }

      return res.json(payload);
    }

    const total = await Category.countDocuments(filter);
    const categories = await Category.find(filter)
      .populate("parentCategory", "name mrCategoryId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, total, page, limit, categories });
  } catch (err) {
    console.error("getAllCategories:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId).populate(
      "parentCategory",
      "name mrCategoryId"
    );
    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, category });
  } catch (err) {
    console.error("getCategoryById:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (
      !req.user.roles.includes(USER_ROLE.SUPER_ADMIN) &&
      category.createdBy?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const childCount = await Category.countDocuments({ parentCategory: category._id });
    if (childCount > 0) {
      return res.status(400).json({
        message: `Cannot delete — this category has ${childCount} child categor${childCount === 1 ? "y" : "ies"}. Reassign or delete children first.`,
      });
    }

    if (category.image?.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id);
    }

    await category.deleteOne();
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("deleteCategory:", err);
    res.status(500).json({ message: "Server error" });
  }
};
