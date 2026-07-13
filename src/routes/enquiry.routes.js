import express from "express";
import {
  createEnquiry,
  getAllEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
} from "../controllers/enquiryController.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../constants/enums.js";

const router = express.Router();

router.post("/enquiry", createEnquiry);

router.get(
  "/all",
  authMiddleware,
  checkPermission(MODULE_KEY.ENQUIRIES, "read"),
  getAllEnquiries
);
router.put(
  "/:id",
  authMiddleware,
  checkPermission(MODULE_KEY.ENQUIRIES, "update"),
  updateEnquiryStatus
);
router.delete(
  "/:id",
  authMiddleware,
  checkPermission(MODULE_KEY.ENQUIRIES, "delete"),
  deleteEnquiry
);

export default router;
