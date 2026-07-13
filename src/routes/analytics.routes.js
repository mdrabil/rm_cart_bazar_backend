// ================================
// routes/analytics.routes.js
// ================================

import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getCustomerAnalytics, getOrderAnalytics, getProductAnalytics, getStoreAnalytics, getStoreStaffAnalytics, getUserAnalytics } from "../controllers/analytics/analytics.controller.js";


const router = express.Router();

// ================================
// ORDER ANALYTICS
// ================================

router.get(
  "/orders",
  authMiddleware,
  getOrderAnalytics
);

router.get(
  "/products",
  authMiddleware,
  getProductAnalytics
);
// ================================
// CUSTOMER ANALYTICS
// ================================

router.get(
  "/customers",
  authMiddleware,
  getCustomerAnalytics
);

// ================================
// STORE ANALYTICS
// ================================

router.get(
  "/stores",
  authMiddleware,
  getStoreAnalytics
);

// ================================
// STORE STAFF ANALYTICS
// ================================

router.get(
  "/store-staff",
  authMiddleware,
  getStoreStaffAnalytics
);

// ================================
// USER ANALYTICS
// ================================

router.get(
  "/users",
  authMiddleware,
  getUserAnalytics
);

export default router;