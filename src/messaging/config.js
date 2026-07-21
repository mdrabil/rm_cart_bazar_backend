/**
 * Message provider credential resolver.
 * DB stores ENV variable names only — values come from process.env.
 */

import { config as appConfig } from "../config/config.js";
import {
  MESSAGE_PROVIDER_MODE,
  MESSAGE_PROVIDER_STATUS,
} from "../models/MessageProvider.model.js";

export function resolveMessageCredentials(providerDoc) {
  const isProd =
    providerDoc.mode === MESSAGE_PROVIDER_MODE.PRODUCTION ||
    appConfig.nodeEnv === "production";

  const apiKeyEnv = isProd
    ? providerDoc.productionApiKeyEnv
    : providerDoc.developmentApiKeyEnv;
  const customerIdEnv = isProd
    ? providerDoc.productionCustomerIdEnv
    : providerDoc.developmentCustomerIdEnv;
  const baseUrlEnv = isProd
    ? providerDoc.productionBaseUrlEnv
    : providerDoc.developmentBaseUrlEnv;
  const countryCodeEnv = isProd
    ? providerDoc.productionCountryCodeEnv
    : providerDoc.developmentCountryCodeEnv;
  const senderIdEnv = isProd
    ? providerDoc.productionSenderIdEnv
    : providerDoc.developmentSenderIdEnv;

  const apiKey = apiKeyEnv ? process.env[apiKeyEnv] : undefined;
  const customerId = customerIdEnv ? process.env[customerIdEnv] : undefined;
  const baseUrl = baseUrlEnv
    ? process.env[baseUrlEnv]
    : process.env.OTP_BASE_URL || "https://cpaas.messagecentral.com/verification/v3";
  const countryCode = countryCodeEnv
    ? process.env[countryCodeEnv]
    : process.env.OTP_COUNTRY_CODE || "91";
  const senderId = senderIdEnv ? process.env[senderIdEnv] : undefined;

  // Email provider does not need API credentials
  const key = String(providerDoc.providerName || "").toLowerCase();
  if (key === "email") {
    return {
      apiKey: null,
      customerId: null,
      baseUrl: null,
      countryCode,
      senderId: null,
      mode: isProd
        ? MESSAGE_PROVIDER_MODE.PRODUCTION
        : MESSAGE_PROVIDER_MODE.DEVELOPMENT,
    };
  }

  if (!apiKey) {
    throw new Error(
      `Missing ENV ${apiKeyEnv || "API_KEY"} for provider ${providerDoc.providerName}`
    );
  }

  return {
    apiKey,
    customerId,
    baseUrl: String(baseUrl || "").replace(/\/$/, ""),
    countryCode: String(countryCode || "91").replace(/\D/g, "") || "91",
    senderId,
    mode: isProd
      ? MESSAGE_PROVIDER_MODE.PRODUCTION
      : MESSAGE_PROVIDER_MODE.DEVELOPMENT,
    envNames: {
      apiKeyEnv,
      customerIdEnv,
      baseUrlEnv,
      countryCodeEnv,
      senderIdEnv,
    },
  };
}

export function assertProviderActive(providerDoc, channel) {
  if (!providerDoc) {
    throw new Error("Message provider not found");
  }

  if (providerDoc.status === MESSAGE_PROVIDER_STATUS.MAINTENANCE) {
    throw new Error(
      `${providerDoc.displayName} is under maintenance. Try another channel.`
    );
  }

  if (providerDoc.status !== MESSAGE_PROVIDER_STATUS.ACTIVE) {
    throw new Error(`${providerDoc.displayName} is not active`);
  }

  if (
    channel &&
    Array.isArray(providerDoc.supportedChannels) &&
    !providerDoc.supportedChannels.includes(channel)
  ) {
    throw new Error(
      `${providerDoc.displayName} does not support channel: ${channel}`
    );
  }
}

export function credentialsConfigured(providerDoc) {
  try {
    const key = String(providerDoc.providerName || "").toLowerCase();
    if (key === "email") return true;
    resolveMessageCredentials(providerDoc);
    return true;
  } catch {
    return false;
  }
}
