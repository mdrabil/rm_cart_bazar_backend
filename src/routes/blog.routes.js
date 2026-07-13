import express from "express";
import {
  createBlog,
  getBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  addComment,
  updateBlogStatus,
} from "../controllers/blog.controller.js";
import multer from "multer";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({});
const upload = multer({ storage });

// ================= BLOG ROUTES =================

// Create blog (protected, admin/author)
router.post(
  "/create",
  authMiddleware,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createBlog
);

// Get all blogs (public)
router.get("/get", getBlogs);

// Get blog by ID (public)
router.get("/single-blog/:id", getBlogById);

// Get blog by slug (public)
router.get("/slug/:slug", getBlogBySlug);

// Update blog (protected, admin/author)
router.put(
  "/update/:id",
  authMiddleware,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateBlog
);

// Delete blog (protected, admin/author)
router.delete("/delete/:id", authMiddleware, deleteBlog);

// Add comment/reply (public)
router.post("/comments/add",authMiddleware, addComment);

// Update blog status only (protected, admin)
router.patch("/status-update/:id", authMiddleware, updateBlogStatus);

export default router;