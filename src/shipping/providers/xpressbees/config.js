export const CAPABILITIES = Object.freeze({
  webhooks: false,
  labelDownload: true,
  manifest: true,
  invoiceDownload: false,
  tracking: true,
  pickupLocations: false,
  cancel: true,
});

export const BASE_URL = Object.freeze({
  development: "https://api.xpressbees.com",
  production: "https://api.xpressbees.com",
});

export const DEFAULT_ENV = Object.freeze({
  developmentKeyIdEnv: "XPRESSBEES_TEST_EMAIL",
  developmentSecretEnv: "XPRESSBEES_TEST_PASSWORD",
  productionKeyIdEnv: "XPRESSBEES_LIVE_EMAIL",
  productionSecretEnv: "XPRESSBEES_LIVE_PASSWORD",
  developmentMerchantIdEnv: "XPRESSBEES_TEST_ACCOUNT",
  productionMerchantIdEnv: "XPRESSBEES_LIVE_ACCOUNT",
});
