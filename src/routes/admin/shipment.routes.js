import express from "express";
import {
  cancelShipment,
  createShipmentForOrder,
  fetchShipmentInvoice,
  fetchShipmentLabel,
  fetchShipmentManifest,
  getActiveShippingProviders,
  getOrderPrefill,
  getProviderPickupLocations,
  getShipmentById,
  getShipmentByOrderId,
  listShipments,
  refreshShipmentTracking,
} from "../../controllers/admin/shipment.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../../constants/enums.js";

const router = express.Router();

router.use(authMiddleware);

const readPerm = checkPermission(MODULE_KEY.SHIPMENTS, "read");
const updatePerm = checkPermission(MODULE_KEY.SHIPMENTS, "update");
const orderReadPerm = checkPermission(MODULE_KEY.ORDERS, "read");
const orderUpdatePerm = checkPermission(MODULE_KEY.ORDERS, "update");

router.get("/providers/active", orderReadPerm, getActiveShippingProviders);
router.get("/providers/:providerName/pickup-locations", orderReadPerm, getProviderPickupLocations);
router.get("/order/:orderId/prefill", orderReadPerm, getOrderPrefill);
router.get("/order/:orderId", readPerm, getShipmentByOrderId);

router.get("/", readPerm, listShipments);
router.post("/", orderUpdatePerm, createShipmentForOrder);

router.get("/:id", readPerm, getShipmentById);
router.post("/:id/track", updatePerm, refreshShipmentTracking);
router.post("/:id/cancel", updatePerm, cancelShipment);
router.get("/:id/label", readPerm, fetchShipmentLabel);
router.get("/:id/manifest", readPerm, fetchShipmentManifest);
router.get("/:id/invoice", readPerm, fetchShipmentInvoice);

export default router;
