import express from "express";
import {
  createCustomer,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  getAllCarts,
  getCartById,
  clearCartByAdmin,
  toggleCustomerStatus,
} from "../../controllers/customer.controller.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { MODULE_KEY } from "../../constants/enums.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";

const router = express.Router();

router.post("/", createCustomer);
router.get("/", getAllCustomers);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  checkPermission(MODULE_KEY.CUSTOMERS, "update"),
  toggleCustomerStatus
);
// router.get("/cart", deleteCustomer);

// Admin routes
router.get("/carts", authMiddleware, adminOnly, getAllCarts);
router.get("/carts/:cartId", authMiddleware, adminOnly, getCartById);
router.delete("/carts/clear/:id", authMiddleware, adminOnly, clearCartByAdmin);

export default router;
