import PaymentGateway, {
  GATEWAY_STATUS,
  GATEWAY_MODE,
} from "../models/PaymentGateway.model.js";

const GATEWAY_SEEDS = [
  {
    gatewayName: "Razorpay",
    displayName: "Razorpay",
    status: GATEWAY_STATUS.ACTIVE,
    mode: GATEWAY_MODE.DEVELOPMENT,
    priority: 1,
    isDefault: true,
    supportedPlatforms: ["website", "android", "ios"],
    supportedPaymentTypes: ["card", "upi", "netbanking", "wallet", "emi"],
    description: "Primary payment gateway — fully implemented",
    webhookEnabled: true,
    developmentKeyIdEnv: "RAZORPAY_KEY_ID",
    developmentSecretEnv: "RAZORPAY_KEY_SECRET",
    productionKeyIdEnv: "RAZORPAY_LIVE_KEY_ID",
    productionSecretEnv: "RAZORPAY_LIVE_SECRET",
    webhookSecretEnv: "RAZORPAY_WEBHOOK_SECRET",
  },
  {
    gatewayName: "PhonePe",
    displayName: "PhonePe",
    status: GATEWAY_STATUS.INACTIVE,
    mode: GATEWAY_MODE.DEVELOPMENT,
    priority: 2,
    isDefault: false,
    supportedPlatforms: ["website", "android", "ios"],
    supportedPaymentTypes: ["upi", "card", "netbanking", "wallet"],
    description: "PhonePe payment gateway",
    webhookEnabled: true,
    developmentKeyIdEnv: "PHONEPE_TEST_MERCHANT_ID",
    developmentSecretEnv: "PHONEPE_TEST_SALT_KEY",
    productionKeyIdEnv: "PHONEPE_LIVE_MERCHANT_ID",
    productionSecretEnv: "PHONEPE_LIVE_SALT_KEY",
    webhookSecretEnv: "PHONEPE_WEBHOOK_SECRET",
  },
  {
    gatewayName: "Cashfree",
    displayName: "Cashfree",
    status: GATEWAY_STATUS.INACTIVE,
    mode: GATEWAY_MODE.DEVELOPMENT,
    priority: 3,
    isDefault: false,
    supportedPlatforms: ["website", "android", "ios"],
    supportedPaymentTypes: ["card", "upi", "netbanking", "wallet"],
    description: "Cashfree payment gateway",
    webhookEnabled: true,
    developmentKeyIdEnv: "CASHFREE_TEST_APP_ID",
    developmentSecretEnv: "CASHFREE_TEST_SECRET_KEY",
    productionKeyIdEnv: "CASHFREE_LIVE_APP_ID",
    productionSecretEnv: "CASHFREE_LIVE_SECRET_KEY",
    webhookSecretEnv: "CASHFREE_WEBHOOK_SECRET",
  },
  {
    gatewayName: "PayU",
    displayName: "PayU",
    status: GATEWAY_STATUS.INACTIVE,
    mode: GATEWAY_MODE.DEVELOPMENT,
    priority: 4,
    isDefault: false,
    supportedPlatforms: ["website", "android", "ios"],
    supportedPaymentTypes: ["card", "upi", "netbanking", "wallet", "emi"],
    description: "PayU payment gateway",
    webhookEnabled: true,
    developmentKeyIdEnv: "PAYU_TEST_MERCHANT_KEY",
    developmentSecretEnv: "PAYU_TEST_MERCHANT_SALT",
    productionKeyIdEnv: "PAYU_LIVE_MERCHANT_KEY",
    productionSecretEnv: "PAYU_LIVE_MERCHANT_SALT",
  },
  {
    gatewayName: "Easebuzz",
    displayName: "Easebuzz",
    status: GATEWAY_STATUS.INACTIVE,
    mode: GATEWAY_MODE.DEVELOPMENT,
    priority: 5,
    isDefault: false,
    supportedPlatforms: ["website", "android", "ios"],
    supportedPaymentTypes: ["card", "upi", "netbanking", "wallet"],
    description: "Easebuzz payment gateway",
    webhookEnabled: true,
    developmentKeyIdEnv: "EASEBUZZ_TEST_KEY",
    developmentSecretEnv: "EASEBUZZ_TEST_SALT",
    productionKeyIdEnv: "EASEBUZZ_LIVE_KEY",
    productionSecretEnv: "EASEBUZZ_LIVE_SALT",
  },
  {
    gatewayName: "Stripe",
    displayName: "Stripe",
    status: GATEWAY_STATUS.INACTIVE,
    mode: GATEWAY_MODE.DEVELOPMENT,
    priority: 10,
    isDefault: false,
    supportedPlatforms: ["website", "android", "ios"],
    supportedPaymentTypes: ["card", "wallet"],
    description: "Stripe international payments",
    webhookEnabled: true,
    developmentKeyIdEnv: "STRIPE_TEST_PUBLISHABLE_KEY",
    developmentSecretEnv: "STRIPE_TEST_SECRET_KEY",
    productionKeyIdEnv: "STRIPE_LIVE_PUBLISHABLE_KEY",
    productionSecretEnv: "STRIPE_LIVE_SECRET_KEY",
    webhookSecretEnv: "STRIPE_WEBHOOK_SECRET",
  },
  {
    gatewayName: "Paytm",
    displayName: "Paytm",
    status: GATEWAY_STATUS.INACTIVE,
    mode: GATEWAY_MODE.DEVELOPMENT,
    priority: 6,
    isDefault: false,
    supportedPlatforms: ["website", "android", "ios"],
    supportedPaymentTypes: ["upi", "wallet", "card", "netbanking"],
    description: "Paytm payment gateway",
    webhookEnabled: true,
    developmentKeyIdEnv: "PAYTM_TEST_MID",
    developmentSecretEnv: "PAYTM_TEST_MERCHANT_KEY",
    productionKeyIdEnv: "PAYTM_LIVE_MID",
    productionSecretEnv: "PAYTM_LIVE_MERCHANT_KEY",
  },
];

export const seedPaymentGateways = async () => {
  console.log("🌱 Seeding payment gateways...");

  for (const seed of GATEWAY_SEEDS) {
    const exists = await PaymentGateway.findOne({
      gatewayName: seed.gatewayName,
    });

    if (!exists) {
      await PaymentGateway.create(seed);
      console.log(`✅ Payment gateway seeded: ${seed.gatewayName}`);
    } else {
      console.log(`ℹ️ Payment gateway exists: ${seed.gatewayName}`);
    }
  }

  console.log("✅ Payment gateway seeding complete");
};
