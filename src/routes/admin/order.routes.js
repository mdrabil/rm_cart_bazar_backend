import express from "express";

import {
  createOrder,
  updateOrder,
  getOrderById,
  getAllOrders,
  deleteOrder
} from "../../controllers/order.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();


// Customer → place order
router.get("/",authMiddleware, getAllOrders);


router.post("/",  createOrder);

// Get all orders → role-wise

// Get order by ID → role-wise
router.get("/:orderId",authMiddleware, getOrderById);

router.patch("/:orderId/status",authMiddleware, updateOrder);

// Delete order → SUPER_ADMIN / Store Roles
router.delete("/:orderId",authMiddleware, deleteOrder);

export default router;
