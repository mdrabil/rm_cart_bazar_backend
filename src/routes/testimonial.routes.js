import express from "express";
import multer from "multer";

import {
  createTestimonial,
  getTestimonials,
  updateTestimonialStatus,
  deleteTestimonial,
  updateTestimonial,
  getApprovedTestimonials,
} from "../controllers/testimonial.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { singleImageUpload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", getTestimonials);
router.get("/approved-list", getApprovedTestimonials);
router.post("/create",authMiddleware, singleImageUpload("image"), createTestimonial);
router.patch("/status/:id", authMiddleware, updateTestimonialStatus);
router.put("/:id/update-details", authMiddleware, singleImageUpload("image"), updateTestimonial);
router.delete("/:id", authMiddleware, deleteTestimonial);

export default router;