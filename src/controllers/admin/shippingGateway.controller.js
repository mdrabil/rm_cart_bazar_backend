import { config as appConfig } from "../../config/config.js";
import ShippingGateway, {
  PROVIDER_STATUS,
} from "../../models/ShippingGateway.model.js";
import ShippingAuditLog from "../../models/ShippingAuditLog.model.js";
import ShippingFactory, {
  isProviderImplemented,
  listSupportedProviderNames,
  canonicalProviderName,
  providerKey,
} from "../../shipping/factory.js";
import { resolveCredentials as resolveProviderCredentials, resolveWebhookUrl } from "../../shipping/config.js";

const sanitizeProvider = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    _id: obj._id,
    providerName: obj.providerName,
    displayName: obj.displayName,
    status: obj.status,
    mode: obj.mode,
    priority: obj.priority,
    isDefault: obj.isDefault,
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
    capabilities: ShippingFactory.getCapabilities(obj.providerName) || {},
    credentialsConfigured: false,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const checkCredentialsConfigured = (gateway) => {
  try {
    resolveProviderCredentials(gateway);
    return true;
  } catch {
    return false;
  }
};

const logAudit = async (req, action, provider, previousState, newState) => {
  await ShippingAuditLog.create({
    action,
    providerName: provider?.providerName,
    providerId: provider?._id,
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

const validateProviderPayload = (body, { isCreate = false } = {}) => {
  const errors = {};

  if (isCreate) {
    if (!body.providerName?.trim()) {
      errors.providerName = "Provider is required";
    } else if (!isProviderImplemented(body.providerName)) {
      errors.providerName = "No backend driver for this provider";
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

  return errors;
};

const pickProviderFields = (body) => {
  const fields = {};
  const allowed = [
    "displayName",
    "status",
    "mode",
    "priority",
    "isDefault",
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

export const listShippingGateways = async (req, res) => {
  try {
    const providers = await ShippingGateway.find().sort({
      priority: 1,
      providerName: 1,
    });

    const data = providers.map((g) => {
      const sanitized = sanitizeProvider(g);
      sanitized.credentialsConfigured = checkCredentialsConfigured(g);
      sanitized.driverImplemented = isProviderImplemented(g.providerName);
      return sanitized;
    });

    const configuredKeys = new Set(data.map((g) => providerKey(g.providerName)));
    const availableProviders = listSupportedProviderNames().filter(
      (name) => !configuredKeys.has(providerKey(name))
    );

    const active =
      data.find((g) => g.status === PROVIDER_STATUS.ACTIVE && g.isDefault) ||
      data.find((g) => g.status === PROVIDER_STATUS.ACTIVE);

    return res.json({
      success: true,
      providers: data,
      activeProvider: active || null,
      supportedProviderNames: listSupportedProviderNames(),
      availableProviders,
      defaultWebhookBaseUrl: process.env.SHIPPING_WEBHOOK_BASE_URL || appConfig.apiPublicUrl || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createShippingGateway = async (req, res) => {
  try {
    const errors = validateProviderPayload(req.body, { isCreate: true });
    if (Object.keys(errors).length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const exists = await ShippingGateway.findOne({
      providerName: { $regex: `^${req.body.providerName.trim()}$`, $options: "i" },
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Provider already exists",
        errors: { providerName: "This provider is already configured" },
      });
    }

    const provider = await ShippingGateway.create({
      providerName: canonicalProviderName(req.body.providerName),
      ...pickProviderFields(req.body),
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await logAudit(req, "CREATE_PROVIDER", provider, null, sanitizeProvider(provider));

    const sanitized = sanitizeProvider(provider);
    sanitized.credentialsConfigured = checkCredentialsConfigured(provider);

    return res.status(201).json({
      success: true,
      message: "Shipping provider created successfully",
      provider: sanitized,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getShippingGatewayById = async (req, res) => {
  try {
    const provider = await ShippingGateway.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const sanitized = sanitizeProvider(provider);
    sanitized.credentialsConfigured = checkCredentialsConfigured(provider);

    return res.json({ success: true, provider: sanitized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateShippingGateway = async (req, res) => {
  try {
    const provider = await ShippingGateway.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const errors = validateProviderPayload(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const previousState = sanitizeProvider(provider);
    const fields = pickProviderFields(req.body);

    for (const [key, value] of Object.entries(fields)) {
      provider[key] = value;
    }

    provider.updatedBy = req.user._id;

    if (provider.isDefault) {
      await ShippingGateway.updateMany(
        { _id: { $ne: provider._id } },
        { $set: { isDefault: false } }
      );
    }

    await provider.save();
    await logAudit(req, "UPDATE_PROVIDER", provider, previousState, sanitizeProvider(provider));

    const sanitized = sanitizeProvider(provider);
    sanitized.credentialsConfigured = checkCredentialsConfigured(provider);

    return res.json({
      success: true,
      message: "Shipping provider updated successfully",
      provider: sanitized,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const setDefaultProvider = async (req, res) => {
  try {
    const provider = await ShippingGateway.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const previousState = sanitizeProvider(provider);

    await ShippingGateway.updateMany({}, { $set: { isDefault: false } });

    provider.isDefault = true;
    provider.status = PROVIDER_STATUS.ACTIVE;
    provider.updatedBy = req.user._id;
    await provider.save();

    await logAudit(req, "SET_DEFAULT_PROVIDER", provider, previousState, sanitizeProvider(provider));

    return res.json({
      success: true,
      message: `${provider.displayName} is now the default shipping provider`,
      provider: sanitizeProvider(provider),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteShippingGateway = async (req, res) => {
  try {
    const provider = await ShippingGateway.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    if (provider.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the default provider. Set another provider as default first.",
      });
    }

    const previousState = sanitizeProvider(provider);
    await provider.deleteOne();
    await logAudit(req, "DELETE_PROVIDER", provider, previousState, null);

    return res.json({
      success: true,
      message: `${provider.displayName} removed. You can add it again from Add Provider.`,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleProviderStatus = async (req, res) => {
  try {
    const provider = await ShippingGateway.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const previousState = sanitizeProvider(provider);

    provider.status =
      provider.status === PROVIDER_STATUS.ACTIVE
        ? PROVIDER_STATUS.INACTIVE
        : PROVIDER_STATUS.ACTIVE;

    provider.updatedBy = req.user._id;
    await provider.save();

    await logAudit(req, "TOGGLE_PROVIDER_STATUS", provider, previousState, sanitizeProvider(provider));

    return res.json({
      success: true,
      message: `Provider ${provider.status === PROVIDER_STATUS.ACTIVE ? "enabled" : "disabled"}`,
      provider: sanitizeProvider(provider),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getProviderAuditLogs = async (req, res) => {
  try {
    const logs = await ShippingAuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("performedBy", "fullName email");

    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
