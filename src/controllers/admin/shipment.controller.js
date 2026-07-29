import Joi from "joi";
import mongoose from "mongoose";
import Shipment, { SHIPMENT_STATUS } from "../../models/Shipment.model.js";
import Order from "../../models/Order.model.js";
import Shipping from "../../shipping/index.js";
import ShippingFactory from "../../shipping/factory.js";
import { safeProviderError, buildTrackingUrl } from "../../shipping/config.js";
import { resolvePickup, resolveDelivery } from "../../shipping/addressResolve.js";
import { buildStoreFilter } from "../../utils/accessHelper.js";

const optionalStr = Joi.string().allow("").optional();
const optionalNum = Joi.number().optional().allow(null);

const createShipmentSchema = Joi.object({
  orderId: Joi.string().required(),
  providerName: Joi.string().optional(),
  pickupLocation: Joi.object({
    source: optionalStr,
    storeId: optionalStr,
    mrStoreId: optionalStr,
    locationId: optionalStr,
    providerPickupId: optionalStr,
    name: optionalStr,
    phone: optionalStr,
    email: optionalStr,
    fullAddress: optionalStr,
    address: optionalStr,
    addressLine: optionalStr,
    addressLine2: optionalStr,
    landmark: optionalStr,
    city: optionalStr,
    state: optionalStr,
    pincode: optionalStr,
    country: optionalStr,
    latitude: optionalNum,
    longitude: optionalNum,
  }).optional(),
  receiver: Joi.object({
    name: optionalStr,
    phone: optionalStr,
    email: Joi.string().email().allow("").optional(),
  }).optional(),
  deliveryAddress: Joi.object({
    fullAddress: optionalStr,
    addressLine: optionalStr,
    addressLine2: optionalStr,
    landmark: optionalStr,
    city: optionalStr,
    state: optionalStr,
    pincode: optionalStr,
    country: optionalStr,
    latitude: optionalNum,
    longitude: optionalNum,
  }).optional(),
  weight: Joi.number().positive().required(),
  weightUnit: Joi.string().default("kg"),
  dimensions: Joi.object({
    length: Joi.number().positive(),
    width: Joi.number().positive(),
    height: Joi.number().positive(),
    unit: Joi.string().default("cm"),
  }).optional(),
  packageCount: Joi.number().integer().min(1).default(1),
  shippingCharges: Joi.number().min(0).default(0),
  codAmount: Joi.number().min(0).default(0),
  notes: Joi.string().allow(""),
});

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow("").default(""),
  status: Joi.string().allow("", "all").optional(),
  // Same as getAllOrders: include (default) or exclude the given status
  statusMode: Joi.string().valid("include", "exclude").default("include"),
  // Filter by Order.store (Shipment has no top-level store field)
  store: Joi.string().allow("").optional(),
  providerName: Joi.string().allow("").optional(),
  sortBy: Joi.string()
    .valid("createdAt", "updatedAt", "status", "mrShipmentId")
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});

const enrichShipment = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const awb = obj.awb || obj.trackingNumber;
  obj.trackingUrl = buildTrackingUrl(obj.providerName, awb);
  obj.capabilities = ShippingFactory.getCapabilities(obj.providerName) || {};
  return obj;
};

const enrichListRow = (row) => {
  const awb = row.awb || row.trackingNumber;
  return {
    _id: row._id,
    mrShipmentId: row.mrShipmentId,
    orderId: row.orderId,
    mrOrderId: row.orderDoc?.mrOrderId || "",
    // Store comes from related Order (backward-compatible extras)
    storeId: row.orderDoc?.store || row.storeDoc?._id || null,
    storeName: row.storeDoc?.storeName || "",
    customerName: row.customerDoc?.fullName || row.receiver?.name || "",
    customerMobile: row.customerDoc?.mobile || row.receiver?.phone || "",
    providerName: row.providerName,
    courierName: row.courierName || "",
    awb: row.awb || "",
    trackingNumber: row.trackingNumber || "",
    trackingUrl: buildTrackingUrl(row.providerName, awb),
    status: row.status,
    paymentType: row.orderDoc?.paymentMethod || "",
    paymentStatus: row.orderDoc?.paymentStatus || "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

/**
 * listShipments — mirrors getAllOrders access/filter/sort/pagination patterns.
 *
 * Changes vs previous implementation:
 * - Role/store access via buildStoreFilter() applied on Order.store after $lookup
 *   (Shipment has no top-level `store`; authorization is order-scoped).
 * - Supports `store` query param and `statusMode` include|exclude (like orders).
 * - Status summary uses the same access + filters but omits the status filter.
 * - Response shape stays backward compatible (shipments, total, page, limit, statusSummary).
 */
export const listShipments = async (req, res) => {
  try {
    const user = req.user;

    const { error, value } = listQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const {
      page,
      limit,
      search,
      status,
      statusMode,
      store,
      providerName,
      sortBy,
      sortOrder,
      startDate,
      endDate,
    } = value;

    // ================= STORE ACCESS (via related Order.store) =================
    // buildStoreFilter uses field name as Mongo key — after order lookup we match orderDoc.store
    const storeObjectId =
      store && mongoose.Types.ObjectId.isValid(store)
        ? new mongoose.Types.ObjectId(store)
        : undefined;

    const accessFilter = await buildStoreFilter(user, {
      field: "orderDoc.store",
      storeId: storeObjectId,
    });

    // ================= SHIPMENT-LEVEL MATCH (before order lookup) =================
    const shipmentMatch = {};

    // Status filter — same include/exclude semantics as getAllOrders
    if (status && status !== "all") {
      if (statusMode === "exclude") {
        shipmentMatch.status = { $ne: status };
      } else {
        shipmentMatch.status = status;
      }
    }

    if (providerName?.trim()) {
      shipmentMatch.providerName = { $regex: providerName.trim(), $options: "i" };
    }

    // Created-at date range (same pattern as getAllOrders)
    if (startDate || endDate) {
      shipmentMatch.createdAt = {};
      if (startDate) shipmentMatch.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        shipmentMatch.createdAt.$lte = end;
      }
    }

    // Shared stages: match shipments → join order → apply store access → join customer/store
    const basePipeline = [
      { $match: shipmentMatch },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderDoc",
        },
      },
      { $unwind: { path: "$orderDoc", preserveNullAndEmptyArrays: false } },
      // Role/store access: only shipments whose Order.store the user can access
      ...(Object.keys(accessFilter).length ? [{ $match: accessFilter }] : []),
      {
        $lookup: {
          from: "stores",
          localField: "orderDoc.store",
          foreignField: "_id",
          as: "storeDoc",
        },
      },
      { $unwind: { path: "$storeDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "customers",
          localField: "orderDoc.customerId",
          foreignField: "_id",
          as: "customerDoc",
        },
      },
      { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
    ];

    // ================= SEARCH =================
    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      basePipeline.push({
        $match: {
          $or: [
            { mrShipmentId: regex },
            { awb: regex },
            { trackingNumber: regex },
            { courierName: regex },
            { providerName: regex },
            { "orderDoc.mrOrderId": regex },
            { "storeDoc.storeName": regex },
            { "customerDoc.fullName": regex },
            { "customerDoc.mobile": regex },
            { "receiver.name": regex },
            { "receiver.phone": regex },
          ],
        },
      });
    }

    // ================= TOTAL (with access + filters + search) =================
    const countPipeline = [...basePipeline, { $count: "total" }];
    const countResult = await Shipment.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // ================= SAFE SORTING =================
    const allowedSortFields = ["createdAt", "updatedAt", "status", "mrShipmentId"];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDir = sortOrder === "asc" ? 1 : -1;

    // ================= PAGE DATA =================
    const pagePipeline = [
      ...basePipeline,
      { $sort: { [finalSortBy]: sortDir } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const rows = await Shipment.aggregate(pagePipeline);
    const shipments = rows.map(enrichListRow);

    // ================= STATUS SUMMARY =================
    // Same access + filters as list, but WITHOUT status filter (like getAllOrders)
    const summaryShipmentMatch = { ...shipmentMatch };
    delete summaryShipmentMatch.status;

    const summaryPipeline = [
      { $match: summaryShipmentMatch },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderDoc",
        },
      },
      { $unwind: { path: "$orderDoc", preserveNullAndEmptyArrays: false } },
      ...(Object.keys(accessFilter).length ? [{ $match: accessFilter }] : []),
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ];

    const statusAgg = await Shipment.aggregate(summaryPipeline);

    // Keep prior key `count` for ShipmentList UI compatibility; also add totalOrders alias
    const statusSummary = Object.values(SHIPMENT_STATUS).map((st) => {
      const found = statusAgg.find((s) => s._id === st);
      const count = found?.count || 0;
      return {
        status: st,
        count,
        totalOrders: count, // alias aligned with getAllOrders naming
      };
    });

    return res.json({
      success: true,
      shipments,
      total,
      page,
      limit,
      statusSummary,
    });
  } catch (error) {
    console.error("listShipments:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createShipmentForOrder = async (req, res) => {
  try {
    const { error, value } = createShipmentSchema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true,
      errors: { wrap: { label: false } },
    });
    if (error) {
      const detail = error.details[0]?.message || "Validation failed";
      return res.status(400).json({
        success: false,
        message: detail,
        errors: { _form: detail },
      });
    }

    const result = await Shipping.createShipment({
      orderId: value.orderId,
      providerName: value.providerName,
      payload: value,
      userId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      shipment: enrichShipment(result.shipment),
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: safeProviderError(err, "Failed to create shipment"),
    });
  }
};

export const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    const order = await Order.findById(shipment.orderId)
      .populate("customerId", "fullName email mobile mrCustomerId")
      .populate({ path: "items.productId", select: "images mrProductId name" })
      .populate("store", "storeName address");

    const enriched = enrichShipment(shipment);

    return res.json({
      success: true,
      shipment: enriched,
      order: order || null,
      capabilities: enriched.capabilities,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getShipmentByOrderId = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.shipmentId) {
      return res.json({ success: true, shipment: null });
    }

    const shipment = await Shipment.findById(order.shipmentId);
    return res.json({
      success: true,
      shipment: shipment ? enrichShipment(shipment) : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshShipmentTracking = async (req, res) => {
  try {
    const result = await Shipping.refreshTracking(req.params.id);
    return res.json({
      success: true,
      message: result.skipped ? result.reason : "Tracking updated",
      shipment: enrichShipment(result.shipment),
      skipped: Boolean(result.skipped),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: safeProviderError(error, "Failed to refresh tracking"),
    });
  }
};

export const cancelShipment = async (req, res) => {
  try {
    const shipment = await Shipping.cancelShipment(req.params.id, req.user._id);
    return res.json({
      success: true,
      message: "Shipment cancelled",
      shipment: enrichShipment(shipment),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: safeProviderError(error, "Failed to cancel shipment"),
    });
  }
};

export const fetchShipmentLabel = async (req, res) => {
  try {
    const result = await Shipping.fetchShipmentDocument(req.params.id, "label");
    const shipment = await Shipment.findById(req.params.id);
    return res.json({
      success: true,
      skipped: Boolean(result?.skipped),
      reason: result?.reason,
      labelUrl: result?.labelUrl || shipment?.labelUrl || null,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: safeProviderError(error, "Failed to fetch label"),
    });
  }
};

export const fetchShipmentManifest = async (req, res) => {
  try {
    const result = await Shipping.fetchShipmentDocument(req.params.id, "manifest");
    const shipment = await Shipment.findById(req.params.id);
    return res.json({
      success: true,
      skipped: Boolean(result?.skipped),
      reason: result?.reason,
      manifestUrl: result?.manifestUrl || shipment?.manifestUrl || null,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: safeProviderError(error, "Failed to fetch manifest"),
    });
  }
};

export const fetchShipmentInvoice = async (req, res) => {
  try {
    const result = await Shipping.fetchShipmentDocument(req.params.id, "invoice");
    const shipment = await Shipment.findById(req.params.id);
    return res.json({
      success: true,
      skipped: Boolean(result?.skipped),
      reason: result?.reason,
      invoiceUrl: result?.invoiceUrl || shipment?.invoiceUrl || null,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: safeProviderError(error, "Failed to fetch invoice"),
    });
  }
};

export const getActiveShippingProviders = async (req, res) => {
  try {
    const providers = await Shipping.listActiveProviders();
    return res.json({ success: true, providers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProviderPickupLocations = async (req, res) => {
  try {
    const result = await Shipping.getPickupLocations(req.params.providerName);
    return res.json({
      success: true,
      locations: result.locations || [],
      skipped: Boolean(result.skipped),
      reason: result.reason,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: safeProviderError(error, "Failed to load pickup locations"),
    });
  }
};

export const getOrderPrefill = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "customerId",
      "fullName email mobile"
    );
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const providers = await Shipping.listActiveProviders();
    const totalQty = (order.items || []).reduce((sum, item) => sum + (item.qty || 0), 0);
    const packageCount = Math.max(1, totalQty);
    const estimatedWeight = Math.max(0.5, Number((totalQty * 0.35).toFixed(2)));
    const isCod = String(order.paymentMethod || "").toUpperCase() === "COD";

    const pickupResolved = await resolvePickup(order);
    const deliveryResolved = await resolveDelivery(order);

    return res.json({
      success: true,
      prefill: {
        orderId: order._id,
        mrOrderId: order.mrOrderId,
        hasShipment: Boolean(order.shipmentId),
        storeId: order.store || null,
        store: pickupResolved.store,
        pickupSource: pickupResolved.pickupSource,
        storeAvailable: pickupResolved.storeAvailable,
        requiresManualPickup: pickupResolved.requiresManualPickup,
        pickupComplete: pickupResolved.pickupComplete,
        pickupMissingFields: pickupResolved.pickupMissingFields,
        pickupLocation: pickupResolved.pickup,
        receiver: deliveryResolved.receiver,
        receiverComplete: deliveryResolved.receiverComplete,
        receiverMissingFields: deliveryResolved.receiverMissingFields,
        deliveryAddress: deliveryResolved.deliveryAddress,
        deliveryComplete: deliveryResolved.deliveryComplete,
        deliveryMissingFields: deliveryResolved.deliveryMissingFields,
        requiresManualDelivery: deliveryResolved.requiresManualDelivery,
        codAmount: isCod ? order.payableAmount : 0,
        weight: estimatedWeight,
        packageCount,
        dimensions: { length: 10, width: 10, height: 10, unit: "cm" },
        items: (order.items || []).map((item) => ({
          productId: item.productId,
          productName: item.productName,
          variantLabel: item.variantLabel,
          qty: item.qty,
          sellingPrice: item.sellingPrice,
          gstPercent: item.gstPercent,
        })),
        totalQty,
        payableAmount: order.payableAmount,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentType: isCod ? "COD" : "Prepaid",
        notes: order.notes || "",
      },
      providers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
