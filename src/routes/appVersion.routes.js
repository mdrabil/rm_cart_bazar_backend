import express from "express";
import { adminOnly } from "../middlewares/adminOnly.js";
import { checkAppVersion, updateAppVersion } from "../controllers/admin/appVersion.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ADMIN

router.post(
"/update",
authMiddleware,
adminOnly,
updateAppVersion
);


// MOBILE APP

router.get(
"/check",
checkAppVersion
);


export default router;