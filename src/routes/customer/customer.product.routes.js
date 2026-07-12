import express from "express";

import {

  getProductById,
  getAllProducts,
  getAllCategorys,
  applyCoupon,
  checkCouponActiveOrNot,
  getSingleProductDetails,
  createProductNotify

} from "../../controllers/customer/customer.product.controller.js";
import { customerAuth, customerauthMiddlewareOptional } from "../../middlewares/customerAuth.middleware.js";
import { addReview } from "../../controllers/review.controller.js";

const router = express.Router();





// ✅ FIRST static routes
router.get("/category-all", getAllCategorys);
router.post(
    "/notify-me",
    customerAuth,
    createProductNotify
);
router.get("/", getAllProducts);
// router.get("/product-details", getSingleProductDetails);
router.get("/product-details/:slug", getSingleProductDetails);
router.post("/add-review",customerAuth, addReview);
router.get("/coupon/apply",customerAuth, applyCoupon);
router.get("/coupon/check-coupon", customerauthMiddlewareOptional, checkCouponActiveOrNot);



// ✅ LAST dynamic route
router.get("/:productId", getProductById);



export default router;
