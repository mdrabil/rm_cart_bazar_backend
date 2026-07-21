import MessageProvider, {
  MESSAGE_PROVIDER_STATUS,
} from "../../models/MessageProvider.model.js";
import {
  isProviderImplemented,
  listSupportedProviderNames,
  canonicalProviderName,
  providerKey,
} from "../../messaging/factory.js";
import { credentialsConfigured } from "../../messaging/config.js";

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
    supportedChannels: obj.supportedChannels,
    description: obj.description,
    developmentApiKeyEnv: obj.developmentApiKeyEnv,
    developmentCustomerIdEnv: obj.developmentCustomerIdEnv,
    developmentBaseUrlEnv: obj.developmentBaseUrlEnv,
    developmentCountryCodeEnv: obj.developmentCountryCodeEnv,
    developmentSenderIdEnv: obj.developmentSenderIdEnv,
    productionApiKeyEnv: obj.productionApiKeyEnv,
    productionCustomerIdEnv: obj.productionCustomerIdEnv,
    productionBaseUrlEnv: obj.productionBaseUrlEnv,
    productionCountryCodeEnv: obj.productionCountryCodeEnv,
    productionSenderIdEnv: obj.productionSenderIdEnv,
    credentialsConfigured: false,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const validatePayload = (body, { isCreate = false } = {}) => {
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

  if (!Array.isArray(body.supportedChannels) || body.supportedChannels.length === 0) {
    errors.supportedChannels = "Select at least one channel";
  }

  const key = providerKey(body.providerName || "");
  if (key && key !== "email") {
    if (isCreate || body.developmentApiKeyEnv !== undefined) {
      if (!body.developmentApiKeyEnv?.trim()) {
        errors.developmentApiKeyEnv = "Development API key ENV name is required";
      }
    }
    if (isCreate || body.productionApiKeyEnv !== undefined) {
      if (!body.productionApiKeyEnv?.trim()) {
        errors.productionApiKeyEnv = "Production API key ENV name is required";
      }
    }
  }

  return errors;
};

const pickFields = (body) => {
  const fields = {};
  const allowed = [
    "displayName",
    "status",
    "mode",
    "priority",
    "isDefault",
    "supportedChannels",
    "description",
    "developmentApiKeyEnv",
    "developmentCustomerIdEnv",
    "developmentBaseUrlEnv",
    "developmentCountryCodeEnv",
    "developmentSenderIdEnv",
    "productionApiKeyEnv",
    "productionCustomerIdEnv",
    "productionBaseUrlEnv",
    "productionCountryCodeEnv",
    "productionSenderIdEnv",
  ];

  for (const key of allowed) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  return fields;
};

/** GET /api/admin/message-provider/list */
export const listMessageProviders = async (req, res) => {
  try {
    const providers = await MessageProvider.find().sort({
      priority: 1,
      providerName: 1,
    });

    const data = providers.map((p) => {
      const sanitized = sanitizeProvider(p);
      sanitized.credentialsConfigured = credentialsConfigured(p);
      sanitized.driverImplemented = isProviderImplemented(p.providerName);
      return sanitized;
    });

    const configuredKeys = new Set(data.map((p) => providerKey(p.providerName)));
    const availableProviders = listSupportedProviderNames().filter(
      (name) => !configuredKeys.has(providerKey(name))
    );

    const active =
      data.find((p) => p.status === MESSAGE_PROVIDER_STATUS.ACTIVE && p.isDefault) ||
      data.find((p) => p.status === MESSAGE_PROVIDER_STATUS.ACTIVE);

    return res.json({
      success: true,
      providers: data,
      activeProvider: active || null,
      supportedProviderNames: listSupportedProviderNames(),
      availableProviders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /api/admin/message-provider/create */
export const createMessageProvider = async (req, res) => {
  try {
    const errors = validatePayload(req.body, { isCreate: true });
    if (Object.keys(errors).length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const exists = await MessageProvider.findOne({
      providerName: { $regex: `^${req.body.providerName.trim()}$`, $options: "i" },
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Provider already exists",
        errors: { providerName: "This provider is already configured" },
      });
    }

    const provider = await MessageProvider.create({
      providerName: canonicalProviderName(req.body.providerName),
      ...pickFields(req.body),
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    if (provider.isDefault) {
      await MessageProvider.updateMany(
        { _id: { $ne: provider._id } },
        { $set: { isDefault: false } }
      );
    }

    const sanitized = sanitizeProvider(provider);
    sanitized.credentialsConfigured = credentialsConfigured(provider);

    return res.status(201).json({
      success: true,
      message: "Message provider created successfully",
      provider: sanitized,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/** PUT /api/admin/message-provider/update/:id */
export const updateMessageProvider = async (req, res) => {
  try {
    const provider = await MessageProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const errors = validatePayload(
      { ...provider.toObject(), ...req.body, providerName: provider.providerName },
      { isCreate: false }
    );
    if (Object.keys(errors).length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const fields = pickFields(req.body);
    for (const [key, value] of Object.entries(fields)) {
      provider[key] = value;
    }
    provider.updatedBy = req.user._id;

    if (provider.isDefault) {
      await MessageProvider.updateMany(
        { _id: { $ne: provider._id } },
        { $set: { isDefault: false } }
      );
    }

    await provider.save();

    const sanitized = sanitizeProvider(provider);
    sanitized.credentialsConfigured = credentialsConfigured(provider);

    return res.json({
      success: true,
      message: "Message provider updated successfully",
      provider: sanitized,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/** PATCH /api/admin/message-provider/status/:id */
export const toggleMessageProviderStatus = async (req, res) => {
  try {
    const provider = await MessageProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const next =
      provider.status === MESSAGE_PROVIDER_STATUS.ACTIVE
        ? MESSAGE_PROVIDER_STATUS.INACTIVE
        : MESSAGE_PROVIDER_STATUS.ACTIVE;

    if (req.body?.status && Object.values(MESSAGE_PROVIDER_STATUS).includes(req.body.status)) {
      provider.status = req.body.status;
    } else {
      provider.status = next;
    }

    provider.updatedBy = req.user._id;
    await provider.save();

    return res.json({
      success: true,
      message: `${provider.displayName} is now ${provider.status}`,
      provider: sanitizeProvider(provider),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/** PATCH /api/admin/message-provider/default/:id */
export const setDefaultMessageProvider = async (req, res) => {
  try {
    const provider = await MessageProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    await MessageProvider.updateMany({}, { $set: { isDefault: false } });
    provider.isDefault = true;
    provider.status = MESSAGE_PROVIDER_STATUS.ACTIVE;
    provider.updatedBy = req.user._id;
    await provider.save();

    return res.json({
      success: true,
      message: `${provider.displayName} is now the default message provider`,
      provider: sanitizeProvider(provider),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/** DELETE /api/admin/message-provider/:id */
export const deleteMessageProvider = async (req, res) => {
  try {
    const provider = await MessageProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    if (provider.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the default provider. Set another as default first.",
      });
    }

    await provider.deleteOne();

    return res.json({
      success: true,
      message: `${provider.displayName} removed`,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/** GET /api/admin/message-provider/:id */
export const getMessageProviderById = async (req, res) => {
  try {
    const provider = await MessageProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const sanitized = sanitizeProvider(provider);
    sanitized.credentialsConfigured = credentialsConfigured(provider);

    return res.json({ success: true, provider: sanitized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
