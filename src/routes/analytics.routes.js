// ================================
// routes/analytics.routes.js
// ================================

import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../constants/enums.js";
import {
  getCustomerAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  getStoreAnalytics,
  getStoreStaffAnalytics,
  getUserAnalytics,
} from "../controllers/analytics/analytics.controller.js";

const router = express.Router();
const dashboardRead = checkPermission(MODULE_KEY.DASHBOARD, "read");

router.get("/orders", authMiddleware, dashboardRead, getOrderAnalytics);
router.get("/products", authMiddleware, dashboardRead, getProductAnalytics);
router.get("/customers", authMiddleware, dashboardRead, getCustomerAnalytics);
router.get("/stores", authMiddleware, dashboardRead, getStoreAnalytics);
router.get("/store-staff", authMiddleware, dashboardRead, getStoreStaffAnalytics);
router.get("/users", authMiddleware, dashboardRead, getUserAnalytics);

export default router;
