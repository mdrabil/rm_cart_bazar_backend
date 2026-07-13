// routes/banner.routes.js
import express from "express";
import {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  getAllBannersApp,
} from "../controllers/banner.controller.js";
import { singleImageUpload } from "../middlewares/upload.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";



const router = express.Router();

router.post("/", singleImageUpload("banners"), createBanner);
router.get("/", getAllBanners);
router.get("/public", getAllBannersApp);
router.get("/:id", getBannerById);
router.put("/:id", singleImageUpload("banners"),authMiddleware, updateBanner);
router.delete("/:id",authMiddleware, deleteBanner);

export default router;