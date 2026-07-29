export const CAPABILITIES = Object.freeze({
  webhooks: true,
  labelDownload: true,
  manifest: true,
  invoiceDownload: false,
  tracking: true,
  pickupLocations: true,
  cancel: true,
});

export const BASE_URL = "https://apiv2.shiprocket.in";

export const DEFAULT_ENV = Object.freeze({
  developmentKeyIdEnv: "SHIPROCKET_EMAIL",
  developmentSecretEnv: "SHIPROCKET_PASSWORD",
  productionKeyIdEnv: "SHIPROCKET_LIVE_EMAIL",
  productionSecretEnv: "SHIPROCKET_LIVE_PASSWORD",
  webhookSecretEnv: "SHIPROCKET_WEBHOOK_SECRET",
});
