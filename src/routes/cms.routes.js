import express from "express";
import {
  getCmsPages,
  saveCmsPage,
  addCmsContent,
  updateCmsContent,
  deleteCmsContent
} from "../controllers/cms.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../constants/enums.js";

const router = express.Router();

router.get("/get", getCmsPages);

router.post(
  "/save/:type",
  authMiddleware,
  checkPermission(MODULE_KEY.WEBSITES, "update"),
  saveCmsPage
);

router.post(
  "/content/:type",
  authMiddleware,
  checkPermission(MODULE_KEY.WEBSITES, "create"),
  addCmsContent
);

router.put(
  "/content/:type/:contentId",
  authMiddleware,
  checkPermission(MODULE_KEY.WEBSITES, "update"),
  updateCmsContent
);

router.delete(
  "/content/:type/:contentId",
  authMiddleware,
  checkPermission(MODULE_KEY.WEBSITES, "delete"),
  deleteCmsContent
);

export default router;
