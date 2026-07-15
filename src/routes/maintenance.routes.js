import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/adminOnly.js";
import { checkMaintenance, saveMaintenance } from "../controllers/maintenance.controller.js";
import { singleImageUpload } from "../middlewares/upload.middleware.js";

const router = express.Router();
router.post(
    "/save",
    authMiddleware,
    singleImageUpload("maintenance"),
    saveMaintenance
);


router.get(
"/check",
checkMaintenance
);

export default router