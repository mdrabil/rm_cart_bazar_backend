import express from "express";
import Shipping from "./index.js";
import { webhookRawBody, safeProviderError } from "./config.js";

const router = express.Router();

router.post("/webhook/:providerName", webhookRawBody, async (req, res) => {
  try {
    const result = await Shipping.handleWebhook(req.params.providerName, req);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("[Shipping][Webhook] Error:", error.message);
    return res.status(400).json({
      success: false,
      message: safeProviderError(error, "Webhook processing failed"),
    });
  }
});

export default router;
