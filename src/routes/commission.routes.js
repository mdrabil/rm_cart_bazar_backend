import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import { createCommissionPlan, getCommissionPlans } from "../controllers/commission.controller.js";

const router = express.Router();

router.use(authMiddleware);


router.get("/", getCommissionPlans);
router.post("/", createCommissionPlan);

export default router;
