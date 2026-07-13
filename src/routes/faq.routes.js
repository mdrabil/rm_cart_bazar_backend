import express from "express";

import {
  upsertFaqPage,
  getFaqPage,
  getFaqAdmin,
  addFaq,
  updateFaq,
  deleteFaq
} from "../controllers/faq.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/adminOnly.js";


const router = express.Router();

router.get("/get-all", getFaqPage);
router.get("/get-all/admin-only",authMiddleware,adminOnly, getFaqPage);

router.get("/admin/faq", authMiddleware, getFaqAdmin);

router.post("/faq-page", authMiddleware, upsertFaqPage);

router.post("/add", authMiddleware, addFaq);

router.put("/:id/update", authMiddleware, updateFaq);

router.delete("/:id/delete", authMiddleware, deleteFaq);

export default router;