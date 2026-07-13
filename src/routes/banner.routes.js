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
import { checkPermission } from "../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../constants/enums.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  checkPermission(MODULE_KEY.BANNERS, "create"),
  singleImageUpload("banners"),
  createBanner
);
router.get("/", getAllBanners);
router.get("/public", getAllBannersApp);
router.get("/:id", getBannerById);
router.put(
  "/:id",
  authMiddleware,
  checkPermission(MODULE_KEY.BANNERS, "update"),
  singleImageUpload("banners"),
  updateBanner
);
router.delete(
  "/:id",
  authMiddleware,
  checkPermission(MODULE_KEY.BANNERS, "delete"),
  deleteBanner
);

export default router;
