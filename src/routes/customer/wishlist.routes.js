import express from "express";

import { customerAuth } from "../../middlewares/customerAuth.middleware.js";
import { addToWishlist, clearWishlist, getWishlist, removeFromWishlist } from "../../controllers/customer/wishlist.controller.js";



const router = express.Router();

router.get("/",customerAuth, getWishlist);
router.post("/add", customerAuth, addToWishlist);
router.post("/remove", customerAuth, removeFromWishlist);
router.delete("/clear", customerAuth, clearWishlist);

export default router;