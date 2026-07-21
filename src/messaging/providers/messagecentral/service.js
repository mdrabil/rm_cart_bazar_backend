/**
 * MessageCentral VerifyNow provider (SMS / WhatsApp via flowType).
 * Docs: POST /verification/v3/send  +  GET/POST /verification/v3/validateOtp
 */

const DEFAULT_BASE = "https://cpaas.messagecentral.com/verification/v3";

async function requestJson(url, { method = "POST", headers = {}, timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const message =
        data?.message ||
        data?.error ||
        data?.responseMessage ||
        `MessageCentral HTTP ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

function flowTypeForChannel(channel) {
  if (channel === "whatsapp") return "WHATSAPP";
  return "SMS";
}

export default function createMessageCentralProvider(credentials, providerDoc) {
  const baseUrl = (credentials.baseUrl || DEFAULT_BASE).replace(/\/$/, "");
  const authToken = credentials.apiKey;
  const customerId = credentials.customerId;
  const defaultCountry = credentials.countryCode || "91";

  return {
    name: providerDoc.providerName,
    channels: providerDoc.supportedChannels || ["sms", "whatsapp"],

    async sendOtp({
      mobile,
      channel = "sms",
      countryCode = defaultCountry,
      otpLength = 6,
    }) {
      if (!mobile) throw new Error("Mobile number is required");
      if (!authToken) throw new Error("MessageCentral auth token is not configured");

      const cleanMobile = String(mobile).replace(/\D/g, "");
      const cc = String(countryCode || defaultCountry).replace(/\D/g, "") || "91";
      const flowType = flowTypeForChannel(channel);

      const params = new URLSearchParams({
        countryCode: cc,
        mobileNumber: cleanMobile,
        flowType,
        otpLength: String(otpLength),
      });

      if (customerId) {
        params.set("customerId", customerId);
      }

      const url = `${baseUrl}/send?${params.toString()}`;

      const data = await requestJson(url, {
        method: "POST",
        headers: {
          authToken,
          Accept: "application/json",
        },
      });

      const verificationId =
        data?.data?.verificationId ||
        data?.verificationId ||
        data?.data?.verification_id ||
        null;

      if (!verificationId) {
        console.warn("[MessageCentral] send response missing verificationId:", data);
      }

      return {
        success: true,
        channel,
        verificationId: verificationId ? String(verificationId) : null,
        providerGeneratesOtp: true,
        raw: data,
      };
    },

    async validateOtp({
      verificationId,
      code,
      mobile,
      countryCode = defaultCountry,
    }) {
      if (!verificationId || !code) {
        return { success: false, message: "Verification id and OTP are required" };
      }
      if (!authToken) {
        return { success: false, message: "MessageCentral auth token is not configured" };
      }

      const params = new URLSearchParams({
        verificationId: String(verificationId),
        code: String(code),
      });

      if (mobile) {
        params.set("mobileNumber", String(mobile).replace(/\D/g, ""));
      }
      if (countryCode) {
        params.set(
          "countryCode",
          String(countryCode).replace(/\D/g, "") || defaultCountry
        );
      }
      if (customerId) {
        params.set("customerId", customerId);
      }

      const url = `${baseUrl}/validateOtp?${params.toString()}`;

      try {
        const data = await requestJson(url, {
          method: "GET",
          headers: {
            authToken,
            Accept: "application/json",
          },
        });

        const status =
          data?.data?.verificationStatus ||
          data?.verificationStatus ||
          data?.data?.status ||
          data?.status;

        const ok =
          String(status || "").toUpperCase() === "VERIFICATION_COMPLETED" ||
          String(status || "").toUpperCase() === "SUCCESS" ||
          data?.responseCode === 200 ||
          data?.success === true;

        if (!ok) {
          return {
            success: false,
            message: data?.message || data?.responseMessage || "Invalid OTP",
            raw: data,
          };
        }

        return { success: true, raw: data };
      } catch (error) {
        return {
          success: false,
          message: error.message || "OTP validation failed",
        };
      }
    },
  };
}
