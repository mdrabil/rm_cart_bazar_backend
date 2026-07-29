import ShippingGateway, {
  PROVIDER_STATUS,
  PROVIDER_MODE,
} from "../models/ShippingGateway.model.js";

const PROVIDER_SEEDS = [
  {
    providerName: "Shiprocket",
    displayName: "Shiprocket",
    status: PROVIDER_STATUS.ACTIVE,
    mode: PROVIDER_MODE.DEVELOPMENT,
    priority: 1,
    isDefault: true,
    description: "Primary shipping provider — fully implemented",
    webhookEnabled: true,
    developmentKeyIdEnv: "SHIPROCKET_EMAIL",
    developmentSecretEnv: "SHIPROCKET_PASSWORD",
    productionKeyIdEnv: "SHIPROCKET_LIVE_EMAIL",
    productionSecretEnv: "SHIPROCKET_LIVE_PASSWORD",
    webhookSecretEnv: "SHIPROCKET_WEBHOOK_SECRET",
  },
  {
    providerName: "Delhivery",
    displayName: "Delhivery",
    status: PROVIDER_STATUS.INACTIVE,
    mode: PROVIDER_MODE.DEVELOPMENT,
    priority: 2,
    isDefault: false,
    description: "Delhivery shipping provider",
    webhookEnabled: true,
    developmentKeyIdEnv: "DELHIVERY_TEST_TOKEN",
    developmentSecretEnv: "DELHIVERY_TEST_CLIENT",
    productionKeyIdEnv: "DELHIVERY_LIVE_TOKEN",
    productionSecretEnv: "DELHIVERY_LIVE_CLIENT",
    webhookSecretEnv: "DELHIVERY_WEBHOOK_SECRET",
  },
  {
    providerName: "BlueDart",
    displayName: "BlueDart",
    status: PROVIDER_STATUS.INACTIVE,
    mode: PROVIDER_MODE.DEVELOPMENT,
    priority: 3,
    isDefault: false,
    description: "BlueDart express shipping",
    webhookEnabled: false,
    developmentKeyIdEnv: "BLUEDART_TEST_LOGIN_ID",
    developmentSecretEnv: "BLUEDART_TEST_LICENSE_KEY",
    productionKeyIdEnv: "BLUEDART_LIVE_LOGIN_ID",
    productionSecretEnv: "BLUEDART_LIVE_LICENSE_KEY",
    developmentMerchantIdEnv: "BLUEDART_TEST_CUSTOMER_CODE",
    productionMerchantIdEnv: "BLUEDART_LIVE_CUSTOMER_CODE",
  },
  {
    providerName: "DTDC",
    displayName: "DTDC",
    status: PROVIDER_STATUS.INACTIVE,
    mode: PROVIDER_MODE.DEVELOPMENT,
    priority: 4,
    isDefault: false,
    description: "DTDC courier services",
    webhookEnabled: true,
    developmentKeyIdEnv: "DTDC_TEST_API_KEY",
    developmentSecretEnv: "DTDC_TEST_CUSTOMER_CODE",
    productionKeyIdEnv: "DTDC_LIVE_API_KEY",
    productionSecretEnv: "DTDC_LIVE_CUSTOMER_CODE",
    webhookSecretEnv: "DTDC_WEBHOOK_SECRET",
  },
  {
    providerName: "XpressBees",
    displayName: "XpressBees",
    status: PROVIDER_STATUS.INACTIVE,
    mode: PROVIDER_MODE.DEVELOPMENT,
    priority: 5,
    isDefault: false,
    description: "XpressBees logistics",
    webhookEnabled: false,
    developmentKeyIdEnv: "XPRESSBEES_TEST_EMAIL",
    developmentSecretEnv: "XPRESSBEES_TEST_PASSWORD",
    productionKeyIdEnv: "XPRESSBEES_LIVE_EMAIL",
    productionSecretEnv: "XPRESSBEES_LIVE_PASSWORD",
    developmentMerchantIdEnv: "XPRESSBEES_TEST_ACCOUNT",
    productionMerchantIdEnv: "XPRESSBEES_LIVE_ACCOUNT",
  },
  {
    providerName: "Ekart",
    displayName: "Ekart",
    status: PROVIDER_STATUS.INACTIVE,
    mode: PROVIDER_MODE.DEVELOPMENT,
    priority: 6,
    isDefault: false,
    description: "Ekart logistics (Flipkart)",
    webhookEnabled: true,
    developmentKeyIdEnv: "EKART_TEST_CLIENT_ID",
    developmentSecretEnv: "EKART_TEST_CLIENT_SECRET",
    productionKeyIdEnv: "EKART_LIVE_CLIENT_ID",
    productionSecretEnv: "EKART_LIVE_CLIENT_SECRET",
    webhookSecretEnv: "EKART_WEBHOOK_SECRET",
  },
  {
    providerName: "Shadowfax",
    displayName: "Shadowfax",
    status: PROVIDER_STATUS.INACTIVE,
    mode: PROVIDER_MODE.DEVELOPMENT,
    priority: 7,
    isDefault: false,
    description: "Shadowfax hyperlocal & express",
    webhookEnabled: true,
    developmentKeyIdEnv: "SHADOWFAX_TEST_TOKEN",
    developmentSecretEnv: "SHADOWFAX_TEST_CLIENT_CODE",
    productionKeyIdEnv: "SHADOWFAX_LIVE_TOKEN",
    productionSecretEnv: "SHADOWFAX_LIVE_CLIENT_CODE",
    webhookSecretEnv: "SHADOWFAX_WEBHOOK_SECRET",
  },
  {
    providerName: "Pickrr",
    displayName: "Pickrr",
    status: PROVIDER_STATUS.INACTIVE,
    mode: PROVIDER_MODE.DEVELOPMENT,
    priority: 8,
    isDefault: false,
    description: "Pickrr shipping aggregator",
    webhookEnabled: true,
    developmentKeyIdEnv: "PICKRR_TEST_AUTH_TOKEN",
    developmentSecretEnv: "PICKRR_TEST_FROM_NAME",
    productionKeyIdEnv: "PICKRR_LIVE_AUTH_TOKEN",
    productionSecretEnv: "PICKRR_LIVE_FROM_NAME",
    webhookSecretEnv: "PICKRR_WEBHOOK_SECRET",
  },
  {
    providerName: "FedEx",
    displayName: "FedEx",
    status: PROVIDER_STATUS.INACTIVE,
    mode: PROVIDER_MODE.DEVELOPMENT,
    priority: 9,
    isDefault: false,
    description: "FedEx international express",
    webhookEnabled: false,
    developmentKeyIdEnv: "FEDEX_TEST_CLIENT_ID",
    developmentSecretEnv: "FEDEX_TEST_CLIENT_SECRET",
    productionKeyIdEnv: "FEDEX_LIVE_CLIENT_ID",
    productionSecretEnv: "FEDEX_LIVE_CLIENT_SECRET",
    developmentMerchantIdEnv: "FEDEX_TEST_ACCOUNT_NUMBER",
    productionMerchantIdEnv: "FEDEX_LIVE_ACCOUNT_NUMBER",
  },
];

export const seedShippingGateways = async () => {
  console.log("🌱 Seeding shipping providers...");

  for (const seed of PROVIDER_SEEDS) {
    const exists = await ShippingGateway.findOne({
      providerName: seed.providerName,
    });

    if (!exists) {
      await ShippingGateway.create(seed);
      console.log(`✅ Shipping provider seeded: ${seed.providerName}`);
    } else {
      console.log(`ℹ️ Shipping provider exists: ${seed.providerName}`);
    }
  }

  console.log("✅ Shipping provider seeding complete");
};
