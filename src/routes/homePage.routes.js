import express from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getHome,
  updateSection,
  deleteSectionImage,
  createOrUpdateHome,
  getHomeData,
} from "../controllers/homePage.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { createHome } from "../controllers/home.contoller.js";

const router = express.Router();

// Multer memory storage for direct Cloudinary upload

// GET Home
router.get("/get", getHome);

router.get("/website", getHomeData);

// CREATE Home (first doc → then upload images)
// router.post(
//   "/create",
//   authMiddleware,
//  upload.fields([
//     { name: "heroCarousel" },       // hero images
//     { name: "heroFeatures" },       // features images
//     { name: "heroProducts" },       // products images
//     { name: "promo" },              // promo bigBanner
//     { name: "countdown" },          // countdown image
//     { name: "newsletter" },         // newsletter background
//   ]),
//   createOrUpdateHome
// );

router.post(
  "/create",
  authMiddleware,
  upload.any(),
  createHome
);



// router.post(
//   "/create",
//   upload.fields([
//     { name: "heroCarousel", maxCount: 10 },
//     { name: "heroFeatures", maxCount: 10 },
//     { name: "heroProducts", maxCount: 10 },

//     { name: "promoBig", maxCount: 1 },
//     { name: "promoSmall", maxCount: 10 },

//     { name: "countdown", maxCount: 1 },
//     { name: "newsletter", maxCount: 1 },
//   ]),
//   createOrUpdateHome
// );


// UPDATE Section
router.put("/update/:section", authMiddleware, upload.single("image"), updateSection);

// DELETE Section Image
router.put("/delete-image/:section", authMiddleware, deleteSectionImage);

export default router;