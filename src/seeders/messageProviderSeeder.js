import MessageProvider, {
  MESSAGE_PROVIDER_STATUS,
  MESSAGE_PROVIDER_MODE,
} from "../models/MessageProvider.model.js";

const PROVIDER_SEEDS = [
  {
    providerName: "Email",
    displayName: "Email OTP (Nodemailer)",
    status: MESSAGE_PROVIDER_STATUS.ACTIVE,
    mode: MESSAGE_PROVIDER_MODE.DEVELOPMENT,
    priority: 1,
    isDefault: true,
    supportedChannels: ["email"],
    description: "Built-in email OTP via Nodemailer templates",
    developmentApiKeyEnv: "EMAIL_USER",
    developmentCustomerIdEnv: "",
    developmentBaseUrlEnv: "",
    productionApiKeyEnv: "EMAIL_USER",
    productionCustomerIdEnv: "",
    productionBaseUrlEnv: "",
  },
  {
    providerName: "MessageCentral",
    displayName: "Message Central OTP",
    status: MESSAGE_PROVIDER_STATUS.ACTIVE,
    mode: MESSAGE_PROVIDER_MODE.DEVELOPMENT,
    priority: 2,
    isDefault: false,
    supportedChannels: ["sms", "whatsapp"],
    description: "MessageCentral VerifyNow — SMS & WhatsApp OTP",
    developmentApiKeyEnv: "OTP_AUTH_TOKEN",
    developmentCustomerIdEnv: "OTP_CUSTOMER_ID",
    developmentBaseUrlEnv: "OTP_BASE_URL",
    developmentCountryCodeEnv: "OTP_COUNTRY_CODE",
    productionApiKeyEnv: "OTP_AUTH_TOKEN",
    productionCustomerIdEnv: "OTP_CUSTOMER_ID",
    productionBaseUrlEnv: "OTP_BASE_URL",
    productionCountryCodeEnv: "OTP_COUNTRY_CODE",
  },
  {
    providerName: "WhatsApp",
    displayName: "WhatsApp OTP (MessageCentral)",
    status: MESSAGE_PROVIDER_STATUS.INACTIVE,
    mode: MESSAGE_PROVIDER_MODE.DEVELOPMENT,
    priority: 3,
    isDefault: false,
    supportedChannels: ["whatsapp"],
    description: "WhatsApp channel via MessageCentral flowType=WHATSAPP",
    developmentApiKeyEnv: "OTP_AUTH_TOKEN",
    developmentCustomerIdEnv: "OTP_CUSTOMER_ID",
    developmentBaseUrlEnv: "OTP_BASE_URL",
    developmentCountryCodeEnv: "OTP_COUNTRY_CODE",
    productionApiKeyEnv: "OTP_AUTH_TOKEN",
    productionCustomerIdEnv: "OTP_CUSTOMER_ID",
    productionBaseUrlEnv: "OTP_BASE_URL",
    productionCountryCodeEnv: "OTP_COUNTRY_CODE",
  },
];

export const seedMessageProviders = async () => {
  for (const seed of PROVIDER_SEEDS) {
    const existing = await MessageProvider.findOne({
      providerName: { $regex: `^${seed.providerName}$`, $options: "i" },
    });

    if (existing) {
      console.log(`⏭ Message provider exists: ${seed.providerName}`);
      continue;
    }

    await MessageProvider.create(seed);
    console.log(`✅ Seeded message provider: ${seed.providerName}`);
  }
};

export default seedMessageProviders;
