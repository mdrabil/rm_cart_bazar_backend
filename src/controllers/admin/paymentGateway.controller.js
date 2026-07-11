import PaymentGateway, {
  GATEWAY_STATUS,
  GATEWAY_MODE,
} from "../../models/PaymentGateway.model.js";
import PaymentAuditLog from "../../models/PaymentAuditLog.model.js";
import {
  isGatewayImplemented,
  listSupportedGatewayNames,
} from "../../services/payment/gatewayRegistry.config.js";
import {
  resolveGatewayCredentials,
} from "../../services/payment/paymentManager.js";

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

    const active = data.find((g) => g.status === GATEWAY_STATUS.ACTIVE && g.isDefault)
      || data.find((g) => g.status === GATEWAY_STATUS.ACTIVE);

    return res.json({
      success: true,
      gateways: data,
      activeGateway: active || null,
      supportedGatewayNames: listSupportedGatewayNames(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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

    const previousState = sanitizeGateway(gateway);

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
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        gateway[key] = req.body[key];
      }
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
