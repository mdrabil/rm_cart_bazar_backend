export const CAPABILITIES = Object.freeze({
  webhooks: true,
  labelDownload: true,
  manifest: false,
  invoiceDownload: false,
  tracking: true,
  pickupLocations: false,
  cancel: true,
});

export const BASE_URL = "https://api.shadowfax.in";

export const DEFAULT_ENV = Object.freeze({
  developmentKeyIdEnv: "SHADOWFAX_TEST_TOKEN",
  developmentSecretEnv: "SHADOWFAX_TEST_CLIENT_CODE",
  productionKeyIdEnv: "SHADOWFAX_LIVE_TOKEN",
  productionSecretEnv: "SHADOWFAX_LIVE_CLIENT_CODE",
  webhookSecretEnv: "SHADOWFAX_WEBHOOK_SECRET",
});
