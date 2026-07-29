export const CAPABILITIES = Object.freeze({
  webhooks: false,
  labelDownload: true,
  manifest: false,
  invoiceDownload: true,
  tracking: true,
  pickupLocations: false,
  cancel: true,
});

export const BASE_URL = Object.freeze({
  development: "https://apis-sandbox.fedex.com",
  production: "https://apis.fedex.com",
});

export const DEFAULT_ENV = Object.freeze({
  developmentKeyIdEnv: "FEDEX_TEST_CLIENT_ID",
  developmentSecretEnv: "FEDEX_TEST_CLIENT_SECRET",
  productionKeyIdEnv: "FEDEX_LIVE_CLIENT_ID",
  productionSecretEnv: "FEDEX_LIVE_CLIENT_SECRET",
  developmentMerchantIdEnv: "FEDEX_TEST_ACCOUNT_NUMBER",
  productionMerchantIdEnv: "FEDEX_LIVE_ACCOUNT_NUMBER",
});
