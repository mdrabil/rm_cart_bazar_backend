export const CAPABILITIES = Object.freeze({
  webhooks: true,
  labelDownload: true,
  manifest: false,
  invoiceDownload: false,
  tracking: true,
  pickupLocations: true,
  cancel: true,
});

export const BASE_URL = Object.freeze({
  development: "https://demodashboardapi.shipsy.io",
  production: "https://app.shipsy.io",
});

export const DEFAULT_ENV = Object.freeze({
  developmentKeyIdEnv: "DTDC_TEST_API_KEY",
  developmentSecretEnv: "DTDC_TEST_CUSTOMER_CODE",
  productionKeyIdEnv: "DTDC_LIVE_API_KEY",
  productionSecretEnv: "DTDC_LIVE_CUSTOMER_CODE",
  webhookSecretEnv: "DTDC_WEBHOOK_SECRET",
});
