import express from "express";

import {
  applyJob,
  getApplications,
  getSingleApplication,
  deleteApplication,
  updateApplicationStatus,
  createJob,
  getAllJobs,
  updateJob,
  deleteJob,
  getApplicationsByUser,
} from "../controllers/job.controller.js";


import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadResume } from "../middlewares/upload.middleware.js";
import { checkPermission } from "../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../constants/enums.js";

const router = express.Router();


router.post("/create-job",authMiddleware,checkPermission(MODULE_KEY.JOBS,'create'), createJob);
router.get("/get-job-list", getAllJobs);
router.put("/update-job/:id/status", updateJob);
router.get("/delete-job/:id/delete", deleteJob);
// router.delete("/applications/:id", deleteApplication);

router.post("/apply-job", uploadResume.single("resume"), applyJob);
router.get("/job-applications", getApplications);
router.patch("/job-applications/:id/status", updateApplicationStatus);
router.get("/job-applications/:id", getSingleApplication);
router.delete("/job-applications/:id",authMiddleware,checkPermission(MODULE_KEY.JOBS,'delete'), deleteApplication);
router.get("/my-applications", getApplicationsByUser);

export default router;