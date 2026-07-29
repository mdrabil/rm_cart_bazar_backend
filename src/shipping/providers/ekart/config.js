export const CAPABILITIES = Object.freeze({
  webhooks: true,
  labelDownload: true,
  manifest: false,
  invoiceDownload: false,
  tracking: true,
  pickupLocations: false,
  cancel: true,
});

export const BASE_URL = Object.freeze({
  development: "https://api.ekartlogistics.com",
  production: "https://api.ekartlogistics.com",
});

export const DEFAULT_ENV = Object.freeze({
  developmentKeyIdEnv: "EKART_TEST_CLIENT_ID",
  developmentSecretEnv: "EKART_TEST_CLIENT_SECRET",
  productionKeyIdEnv: "EKART_LIVE_CLIENT_ID",
  productionSecretEnv: "EKART_LIVE_CLIENT_SECRET",
  webhookSecretEnv: "EKART_WEBHOOK_SECRET",
});
