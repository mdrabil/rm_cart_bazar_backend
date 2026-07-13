import express from "express";
import {
  createCategory,
  updateCategory,
  getAllCategories,
  getCategoryById,
  deleteCategory
} from "../../controllers/category.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../../constants/enums.js";
import { singleImageUpload } from "../../middlewares/upload.middleware.js";


const router = express.Router();



// CRUD
router.post("/create", authMiddleware, singleImageUpload("category"), checkPermission(MODULE_KEY.CATEGORIES, "create"), createCategory);
router.put("/:categoryId",authMiddleware,singleImageUpload("category"),  checkPermission(MODULE_KEY.CATEGORIES, "update"), updateCategory);
router.get("/", getAllCategories);
router.get("/:categoryId", getCategoryById);
router.delete("/:categoryId",authMiddleware, checkPermission(MODULE_KEY.CATEGORIES, "delete"), deleteCategory);

export default router;
