export const CAPABILITIES = Object.freeze({
  webhooks: true,
  labelDownload: true,
  manifest: true,
  invoiceDownload: false,
  tracking: true,
  pickupLocations: false,
  cancel: true,
});

export const BASE_URL = Object.freeze({
  development: "https://staging-express.delhivery.com",
  production: "https://track.delhivery.com",
});

export const DEFAULT_ENV = Object.freeze({
  developmentKeyIdEnv: "DELHIVERY_TEST_TOKEN",
  developmentSecretEnv: "DELHIVERY_TEST_CLIENT",
  productionKeyIdEnv: "DELHIVERY_LIVE_TOKEN",
  productionSecretEnv: "DELHIVERY_LIVE_CLIENT",
  webhookSecretEnv: "DELHIVERY_WEBHOOK_SECRET",
});
