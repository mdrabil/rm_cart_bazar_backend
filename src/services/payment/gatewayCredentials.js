import { GATEWAY_STATUS } from "../../models/PaymentGateway.model.js";
import { config } from "../../config/config.js";
import { GATEWAY_MODE } from "../../models/PaymentGateway.model.js";

export function resolveGatewayCredentials(gatewayDoc) {
  if (!gatewayDoc) {
    throw new Error("Payment gateway configuration not found");
  }

  const isProduction =
    gatewayDoc.mode === GATEWAY_MODE.PRODUCTION ||
    config.nodeEnv === "production";

  const keyIdEnv = isProduction
    ? gatewayDoc.productionKeyIdEnv
    : gatewayDoc.developmentKeyIdEnv;

  const secretEnv = isProduction
    ? gatewayDoc.productionSecretEnv
    : gatewayDoc.developmentSecretEnv;

  const merchantIdEnv = isProduction
    ? gatewayDoc.productionMerchantIdEnv
    : gatewayDoc.developmentMerchantIdEnv;

  const missing = [];

  if (!keyIdEnv) {
    missing.push(isProduction ? "productionKeyIdEnv" : "developmentKeyIdEnv");
  }
  if (!secretEnv) {
    missing.push(isProduction ? "productionSecretEnv" : "developmentSecretEnv");
  }

  if (missing.length) {
    throw new Error(
      `Gateway "${gatewayDoc.gatewayName}" is missing env name config: ${missing.join(", ")}`
    );
  }

  const keyId = process.env[keyIdEnv];
  const secret = process.env[secretEnv];
  const merchantId = merchantIdEnv ? process.env[merchantIdEnv] : undefined;
  const webhookSecret = gatewayDoc.webhookSecretEnv
    ? process.env[gatewayDoc.webhookSecretEnv]
    : undefined;

  const missingValues = [];
  if (!keyId) missingValues.push(keyIdEnv);
  if (!secret) missingValues.push(secretEnv);

  if (missingValues.length) {
    throw new Error(
      `Missing payment credentials in .env: ${missingValues.join(", ")}`
    );
  }

  return {
    keyId,
    secret,
    merchantId,
    webhookSecret,
    mode: isProduction ? GATEWAY_MODE.PRODUCTION : GATEWAY_MODE.DEVELOPMENT,
    keyIdEnv,
    secretEnv,
    merchantIdEnv,
    webhookSecretEnv: gatewayDoc.webhookSecretEnv,
  };
}

export function validateGatewayConfig(gatewayDoc, platform = "website") {
  if (!gatewayDoc) {
    throw new Error("Payment gateway not configured");
  }

  if (gatewayDoc.status !== GATEWAY_STATUS.ACTIVE) {
    throw new Error(
      `Payment gateway "${gatewayDoc.displayName}" is ${gatewayDoc.status}`
    );
  }

  if (
    platform &&
    gatewayDoc.supportedPlatforms?.length &&
    !gatewayDoc.supportedPlatforms.includes(platform)
  ) {
    throw new Error(
      `Gateway "${gatewayDoc.displayName}" does not support platform: ${platform}`
    );
  }

  resolveGatewayCredentials(gatewayDoc);
  return true;
}
