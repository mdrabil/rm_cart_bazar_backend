export const CAPABILITIES = Object.freeze({
  webhooks: false,
  labelDownload: true,
  manifest: false,
  invoiceDownload: true,
  tracking: true,
  pickupLocations: false,
  cancel: false,
});

export const BASE_URL = Object.freeze({
  development: "https://api.bluedart.com/servlet/RoutingServlet",
  production: "https://api.bluedart.com/servlet/RoutingServlet",
});

export const DEFAULT_ENV = Object.freeze({
  developmentKeyIdEnv: "BLUEDART_TEST_LOGIN_ID",
  developmentSecretEnv: "BLUEDART_TEST_LICENSE_KEY",
  productionKeyIdEnv: "BLUEDART_LIVE_LOGIN_ID",
  productionSecretEnv: "BLUEDART_LIVE_LICENSE_KEY",
  developmentMerchantIdEnv: "BLUEDART_TEST_CUSTOMER_CODE",
  productionMerchantIdEnv: "BLUEDART_LIVE_CUSTOMER_CODE",
});
