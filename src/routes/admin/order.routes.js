import express from "express";

import {
  createOrder,
  updateOrder,
  getOrderById,
  getAllOrders,
  deleteOrder
} from "../../controllers/order.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../../constants/enums.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  checkPermission(MODULE_KEY.ORDERS, "read"),
  getAllOrders
);

router.post(
  "/",
  authMiddleware,
  checkPermission(MODULE_KEY.ORDERS, "create"),
  createOrder
);

// Get all orders → role-wise

// Get order by ID → role-wise
router.get(
  "/:orderId",
  authMiddleware,
  checkPermission(MODULE_KEY.ORDERS, "read"),
  getOrderById
);

router.patch(
  "/:orderId/status",
  authMiddleware,
  checkPermission(MODULE_KEY.ORDERS, "update"),
  updateOrder
);

router.delete(
  "/:orderId",
  authMiddleware,
  checkPermission(MODULE_KEY.ORDERS, "delete"),
  deleteOrder
);

export default router;
