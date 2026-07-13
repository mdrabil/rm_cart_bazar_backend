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
import { customerAuth } from "../middlewares/customerAuth.middleware.js";

const router = express.Router();

router.post(
  "/create-job",
  authMiddleware,
  checkPermission(MODULE_KEY.JOBS, "create"),
  createJob
);
router.get("/get-job-list", getAllJobs);
router.put(
  "/update-job/:id/status",
  authMiddleware,
  checkPermission(MODULE_KEY.JOBS, "update"),
  updateJob
);
router.get(
  "/delete-job/:id/delete",
  authMiddleware,
  checkPermission(MODULE_KEY.JOBS, "delete"),
  deleteJob
);

router.post("/apply-job", uploadResume.single("resume"), applyJob);
router.get(
  "/job-applications",
  authMiddleware,
  checkPermission(MODULE_KEY.JOBS, "read"),
  getApplications
);
router.patch(
  "/job-applications/:id/status",
  authMiddleware,
  checkPermission(MODULE_KEY.JOBS, "update"),
  updateApplicationStatus
);
router.get(
  "/job-applications/:id",
  authMiddleware,
  checkPermission(MODULE_KEY.JOBS, "read"),
  getSingleApplication
);
router.delete(
  "/job-applications/:id",
  authMiddleware,
  checkPermission(MODULE_KEY.JOBS, "delete"),
  deleteApplication
);
router.get("/my-applications", customerAuth, getApplicationsByUser);

export default router;
