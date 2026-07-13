// routes/counter.routes.js

import express from "express";

import {
  getAllCounters,
  updateCounter,
  deleteCounter,
} from "../../controllers/single.controller.js";

import { adminAndSuperAdmin } from "../../middlewares/adminOnly.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware, adminAndSuperAdmin);

router.get("/get-all", getAllCounters);

router.put("/update/:id", updateCounter);

router.delete("/delete/:id", deleteCounter);

export default router;