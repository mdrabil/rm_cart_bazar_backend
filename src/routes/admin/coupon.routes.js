import express from "express";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon
} from "../../controllers/coupon.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
import { withRealtimeEmit } from "../../middlewares/realtimeEmit.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(withRealtimeEmit("coupon"));

router.post("/create", adminOnly, createCoupon);
router.get("/", getAllCoupons);
router.put("/:couponId",adminOnly, updateCoupon);
router.delete("/:couponId", adminOnly, deleteCoupon);

export default router;
