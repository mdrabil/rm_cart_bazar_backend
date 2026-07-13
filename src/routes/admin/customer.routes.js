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

router.use(authMiddleware);

router.post(
  "/",
  checkPermission(MODULE_KEY.CUSTOMERS, "create"),
  createCustomer
);
router.get(
  "/",
  checkPermission(MODULE_KEY.CUSTOMERS, "read"),
  getAllCustomers
);
router.put(
  "/:id",
  checkPermission(MODULE_KEY.CUSTOMERS, "update"),
  updateCustomer
);
router.delete(
  "/:id",
  checkPermission(MODULE_KEY.CUSTOMERS, "delete"),
  deleteCustomer
);
router.patch(
  "/:id/toggle-status",
  checkPermission(MODULE_KEY.CUSTOMERS, "update"),
  toggleCustomerStatus
);

router.get("/carts", adminOnly, getAllCarts);
router.get("/carts/:cartId", adminOnly, getCartById);
router.delete("/carts/clear/:id", adminOnly, clearCartByAdmin);

export default router;
