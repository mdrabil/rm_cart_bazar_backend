export const CAPABILITIES = Object.freeze({
  webhooks: true,
  labelDownload: true,
  manifest: true,
  invoiceDownload: false,
  tracking: true,
  pickupLocations: true,
  cancel: true,
});

export const BASE_URL = Object.freeze({
  development: "https://pickrr.com/api",
  production: "https://pickrr.com/api",
});

export const DEFAULT_ENV = Object.freeze({
  developmentKeyIdEnv: "PICKRR_TEST_AUTH_TOKEN",
  developmentSecretEnv: "PICKRR_TEST_FROM_NAME",
  productionKeyIdEnv: "PICKRR_LIVE_AUTH_TOKEN",
  productionSecretEnv: "PICKRR_LIVE_FROM_NAME",
  webhookSecretEnv: "PICKRR_WEBHOOK_SECRET",
});
