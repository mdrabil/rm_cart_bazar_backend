import express from "express";
import {
  createCmsPage,
  updateCmsPage,
  deleteCmsPage,
  getAllCmsPages,
  getCmsBySlug,
} from "../controllers/cmsPage.controller.js";
import { adminOnly } from "../middlewares/adminOnly.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";



const router = express.Router();

/* Admin */
router.post("/create", authMiddleware, adminOnly, createCmsPage);
router.put("/:id", authMiddleware, adminOnly, updateCmsPage);
router.delete("/:id", authMiddleware, adminOnly, deleteCmsPage);
router.get("/", authMiddleware, getAllCmsPages);

/* Public */
router.get("/:slug", getCmsBySlug);

export default router;