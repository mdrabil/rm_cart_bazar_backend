// routes/module.routes.js
import express from "express";
import { createModule, deleteModule, getModules } from "../../controllers/module.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/adminOnly.js";

const router = express.Router();

router.post("/",authMiddleware,adminOnly, createModule);
router.get("/", getModules);
router.delete("/:id",authMiddleware,adminOnly, deleteModule);

export default router;