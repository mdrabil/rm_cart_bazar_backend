// routes/traffic.routes.js

import express from "express";
import { saveTraffic } from "../middlewares/traffic.middleware.js";



const router = express.Router();

router.post(
  "/save",
  saveTraffic,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Traffic saved",
    });
  }
);



export default router;