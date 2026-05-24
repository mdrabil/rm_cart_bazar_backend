import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";


import {
  createProduct,

  getProductById,
  getAllProducts,
  deleteProduct,
  updateProductStatus
} from "../../controllers/product.controller.js";

import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../../constants/enums.js";
import { arrayImagesThumbnailsUpload, upload } from "../../middlewares/upload.middleware.js";
import { createNewProduct, updateProduct } from "../../controllers/new-product.controller.js";

const router = express.Router();

// // 🔹 Create product with images
// router.post(
//   "/create",
//   authMiddleware,
//  checkPermission(MODULE_KEY.PRODUCTS,'create'),
 
//     // arrayImagesThumbnailsUpload("products", 10, 10),
//     arrayImagesThumbnailsUpload(10, 10),
//   createProduct
// );

// routes/product.routes.js


// =========================
// MULTIPLE FILES
// =========================

const productUpload = upload.fields([
  {
    name: "images",
    maxCount: 10,
  },

  {
    name: "thumbnails",
    maxCount: 10,
  },

  {
    name: "layerImages",
    maxCount: 50,
  },

  {
    name: "areaImages",
    maxCount: 20,
  },
]);


router.post(
  "/create",

  authMiddleware,

  checkPermission(
    MODULE_KEY.PRODUCTS,
    "create"
  ),

  productUpload,

  createNewProduct
);





router.put(
  "/:productId",

authMiddleware,
  upload.fields([
    {
      name: "images",
      maxCount: 10,
    },

    {
      name: "thumbnails",
      maxCount: 10,
    },

    {
      name: "areaImages",
      maxCount: 10,
    },

    {
      name: "layerImages",
      maxCount: 20,
    },
  ]),

  updateProduct
);




router.patch(
  "/:productId/status",
  authMiddleware, // attach user info
   checkPermission(MODULE_KEY.PRODUCTS,'update'),
  updateProductStatus
);



// 🔹 Get product by ID
router.get(
  "/:productId",
  authMiddleware,
  getProductById
);

// 🔹 Get all products
router.get(
  "/",
  authMiddleware,
  // checkPermission(MODULE_KEY.PRODUCT,'read'),
  getAllProducts
);

// 🔹 Delete product
router.delete(
  "/:productId",
  authMiddleware,
 checkPermission(MODULE_KEY.PRODUCTS,'delete'),

  deleteProduct
);

export default router;
