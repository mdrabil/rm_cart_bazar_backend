import express from "express";
import {
  createEnquiry,
  getAllEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
} from "../controllers/enquiryController.js";

const router = express.Router();

router.post("/enquiry", createEnquiry);
router.get("/all", getAllEnquiries);
router.put("/:id", updateEnquiryStatus);
router.delete("/:id", deleteEnquiry);

export default router;