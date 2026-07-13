import { config as appConfig } from "../../config/config.js";
import PaymentGateway, {
  GATEWAY_STATUS,
  GATEWAY_MODE,
} from "../../models/PaymentGateway.model.js";
import PaymentAuditLog from "../../models/PaymentAuditLog.model.js";
import PaymentFactory, {
  isGatewayImplemented,
  listSupportedGatewayNames,
  canonicalGatewayName,
  gatewayKey,
} from "../../payment/factory.js";
import { resolveCredentials as resolveGatewayCredentials, resolveWebhookUrl } from "../../payment/config.js";

const sanitizeGateway = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    _id: obj._id,
    gatewayName: obj.gatewayName,
    displayName: obj.displayName,
    status: obj.status,
    mode: obj.mode,
    priority: obj.priority,
    isDefault: obj.isDefault,
    supportedPlatforms: obj.supportedPlatforms,
    supportedPaymentTypes: obj.supportedPaymentTypes,
    description: obj.description,
    webhookEnabled: obj.webhookEnabled,
    developmentKeyIdEnv: obj.developmentKeyIdEnv,
    developmentSecretEnv: obj.developmentSecretEnv,
    developmentMerchantIdEnv: obj.developmentMerchantIdEnv,
    productionKeyIdEnv: obj.productionKeyIdEnv,
    productionSecretEnv: obj.productionSecretEnv,
    productionMerchantIdEnv: obj.productionMerchantIdEnv,
    webhookSecretEnv: obj.webhookSecretEnv,
    webhookUrl: obj.webhookUrl || "",
    webhookUrlEnv: obj.webhookUrlEnv,
    resolvedWebhookUrl: resolveWebhookUrl(obj),
    credentialsConfigured: false,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const checkCredentialsConfigured = (gateway) => {
  try {
    resolveGatewayCredentials(gateway);
    return true;
  } catch {
    return false;
  }
};

const logAudit = async (req, action, gateway, previousState, newState) => {
  await PaymentAuditLog.create({
    action,
    gatewayName: gateway?.gatewayName,
    gatewayId: gateway?._id,
    performedBy: req.user?._id,
    previousState,
    newState,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });
};

const isValidUrl = (value) => {
  if (!value?.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const validateGatewayPayload = (body, { isCreate = false } = {}) => {
  const errors = {};

  if (isCreate) {
    if (!body.gatewayName?.trim()) {
      errors.gatewayName = "Gateway is required";
    } else if (!isGatewayImplemented(body.gatewayName)) {
      errors.gatewayName = "No backend driver for this gateway";
    }
  }

  if (!body.displayName?.trim()) {
    errors.displayName = "Display name is required";
  }
  if (!body.developmentKeyIdEnv?.trim()) {
    errors.developmentKeyIdEnv = "Sandbox key env name is required";
  }
  if (!body.developmentSecretEnv?.trim()) {
    errors.developmentSecretEnv = "Sandbox secret env name is required";
  }
  if (!body.productionKeyIdEnv?.trim()) {
    errors.productionKeyIdEnv = "Live key env name is required";
  }
  if (!body.productionSecretEnv?.trim()) {
    errors.productionSecretEnv = "Live secret env name is required";
  }
  if (body.webhookUrl?.trim() && !isValidUrl(body.webhookUrl)) {
    errors.webhookUrl = "Enter a valid http(s) webhook URL";
  }
  if (!Array.isArray(body.supportedPlatforms) || body.supportedPlatforms.length === 0) {
    errors.supportedPlatforms = "Select at least one platform";
  }

  return errors;
};

const pickGatewayFields = (body) => {
  const fields = {};
  const allowed = [
    "displayName",
    "status",
    "mode",
    "priority",
    "isDefault",
    "supportedPlatforms",
    "supportedPaymentTypes",
    "description",
    "webhookEnabled",
    "developmentKeyIdEnv",
    "developmentSecretEnv",
    "developmentMerchantIdEnv",
    "productionKeyIdEnv",
    "productionSecretEnv",
    "productionMerchantIdEnv",
    "webhookSecretEnv",
    "webhookUrl",
    "webhookUrlEnv",
  ];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      fields[key] = key === "webhookUrl" ? String(body[key] || "").trim() : body[key];
    }
  }

  return fields;
};

export const listPaymentGateways = async (req, res) => {
  try {
    const gateways = await PaymentGateway.find().sort({
      priority: 1,
      gatewayName: 1,
    });

    const data = gateways.map((g) => {
      const sanitized = sanitizeGateway(g);
      sanitized.credentialsConfigured = checkCredentialsConfigured(g);
      sanitized.driverImplemented = isGatewayImplemented(g.gatewayName);
      return sanitized;
    });

    const configuredKeys = new Set(data.map((g) => gatewayKey(g.gatewayName)));
    const availableGateways = listSupportedGatewayNames().filter(
      (name) => !configuredKeys.has(gatewayKey(name))
    );

    const active = data.find((g) => g.status === GATEWAY_STATUS.ACTIVE && g.isDefault)
      || data.find((g) => g.status === GATEWAY_STATUS.ACTIVE);

    return res.json({
      success: true,
      gateways: data,
      activeGateway: active || null,
      supportedGatewayNames: listSupportedGatewayNames(),
      availableGateways,
      defaultWebhookBaseUrl: appConfig.paymentWebhookBaseUrl || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPaymentGateway = async (req, res) => {
  try {
    const errors = validateGatewayPayload(req.body, { isCreate: true });
    if (Object.keys(errors).length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const exists = await PaymentGateway.findOne({
      gatewayName: { $regex: `^${req.body.gatewayName.trim()}$`, $options: "i" },
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Gateway already exists",
        errors: { gatewayName: "This gateway is already configured" },
      });
    }

    const gateway = await PaymentGateway.create({
      gatewayName: canonicalGatewayName(req.body.gatewayName),
      ...pickGatewayFields(req.body),
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await logAudit(req, "CREATE_GATEWAY", gateway, null, sanitizeGateway(gateway));

    const sanitized = sanitizeGateway(gateway);
    sanitized.credentialsConfigured = checkCredentialsConfigured(gateway);

    return res.status(201).json({
      success: true,
      message: "Payment gateway created successfully",
      gateway: sanitized,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getPaymentGatewayById = async (req, res) => {
  try {
    const gateway = await PaymentGateway.findById(req.params.id);

    if (!gateway) {
      return res.status(404).json({ success: false, message: "Gateway not found" });
    }

    const sanitized = sanitizeGateway(gateway);
    sanitized.credentialsConfigured = checkCredentialsConfigured(gateway);

    return res.json({ success: true, gateway: sanitized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaymentGateway = async (req, res) => {
  try {
    const gateway = await PaymentGateway.findById(req.params.id);

    if (!gateway) {
      return res.status(404).json({ success: false, message: "Gateway not found" });
    }

    const errors = validateGatewayPayload(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const previousState = sanitizeGateway(gateway);
    const fields = pickGatewayFields(req.body);

    for (const [key, value] of Object.entries(fields)) {
      gateway[key] = value;
    }

    gateway.updatedBy = req.user._id;

    if (gateway.isDefault) {
      await PaymentGateway.updateMany(
        { _id: { $ne: gateway._id } },
        { $set: { isDefault: false } }
      );
    }

    await gateway.save();

    await logAudit(req, "UPDATE_GATEWAY", gateway, previousState, sanitizeGateway(gateway));

    const sanitized = sanitizeGateway(gateway);
    sanitized.credentialsConfigured = checkCredentialsConfigured(gateway);

    return res.json({
      success: true,
      message: "Payment gateway updated successfully",
      gateway: sanitized,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const setDefaultGateway = async (req, res) => {
  try {
    const gateway = await PaymentGateway.findById(req.params.id);

    if (!gateway) {
      return res.status(404).json({ success: false, message: "Gateway not found" });
    }

    const previousState = sanitizeGateway(gateway);

    await PaymentGateway.updateMany({}, { $set: { isDefault: false } });

    gateway.isDefault = true;
    gateway.status = GATEWAY_STATUS.ACTIVE;
    gateway.updatedBy = req.user._id;
    await gateway.save();

    await logAudit(req, "SET_DEFAULT_GATEWAY", gateway, previousState, sanitizeGateway(gateway));

    return res.json({
      success: true,
      message: `${gateway.displayName} is now the default payment gateway`,
      gateway: sanitizeGateway(gateway),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePaymentGateway = async (req, res) => {
  try {
    const gateway = await PaymentGateway.findById(req.params.id);

    if (!gateway) {
      return res.status(404).json({ success: false, message: "Gateway not found" });
    }

    if (gateway.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the default gateway. Set another gateway as default first.",
      });
    }

    const previousState = sanitizeGateway(gateway);
    await gateway.deleteOne();
    await logAudit(req, "DELETE_GATEWAY", gateway, previousState, null);

    return res.json({
      success: true,
      message: `${gateway.displayName} removed. You can add it again from Add Gateway.`,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleGatewayStatus = async (req, res) => {
  try {
    const gateway = await PaymentGateway.findById(req.params.id);

    if (!gateway) {
      return res.status(404).json({ success: false, message: "Gateway not found" });
    }

    const previousState = sanitizeGateway(gateway);

    gateway.status =
      gateway.status === GATEWAY_STATUS.ACTIVE
        ? GATEWAY_STATUS.INACTIVE
        : GATEWAY_STATUS.ACTIVE;

    gateway.updatedBy = req.user._id;
    await gateway.save();

    await logAudit(req, "TOGGLE_GATEWAY_STATUS", gateway, previousState, sanitizeGateway(gateway));

    return res.json({
      success: true,
      message: `Gateway ${gateway.status === GATEWAY_STATUS.ACTIVE ? "enabled" : "disabled"}`,
      gateway: sanitizeGateway(gateway),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getGatewayAuditLogs = async (req, res) => {
  try {
    const logs = await PaymentAuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("performedBy", "fullName email");

    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVerificationLogs = async (req, res) => {
  try {
    const PaymentVerificationLog = (
      await import("../../models/PaymentVerificationLog.model.js")
    ).default;

    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const logs = await PaymentVerificationLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("paymentId", "mrPaymentId gatewayOrderId transactionId");

    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
