import { config } from "../../config/config.js";

export const PAYMENT_PLATFORMS = Object.freeze({
  WEBSITE: "website",
  ANDROID: "android",
  IOS: "ios",
});

const APP_PLATFORMS = new Set([
  PAYMENT_PLATFORMS.ANDROID,
  PAYMENT_PLATFORMS.IOS,
]);

export function normalizePlatform(platform = PAYMENT_PLATFORMS.WEBSITE) {
  const value = String(platform || PAYMENT_PLATFORMS.WEBSITE).trim().toLowerCase();

  if (!Object.values(PAYMENT_PLATFORMS).includes(value)) {
    throw new Error(
      `Invalid payment platform. Allowed: ${Object.values(PAYMENT_PLATFORMS).join(", ")}`
    );
  }

  return value;
}

export function isAppPlatform(platform) {
  return APP_PLATFORMS.has(normalizePlatform(platform));
}

export function isWebsitePlatform(platform) {
  return normalizePlatform(platform) === PAYMENT_PLATFORMS.WEBSITE;
}

function getAllowedWebsiteOrigins() {
  const origins = new Set();

  if (config.websiteUrl) {
    try {
      origins.add(new URL(config.websiteUrl).origin);
    } catch {
      /* ignore invalid WEBSITE_URL */
    }
  }

  if (Array.isArray(config.corsOrigins)) {
    config.corsOrigins.forEach((origin) => {
      try {
        origins.add(new URL(origin).origin);
      } catch {
        /* ignore invalid CORS origin */
      }
    });
  }

  return origins;
}

function assertHttpWebsiteUrl(url, label) {
  if (!url || typeof url !== "string") {
    throw new Error(`${label} is required for website payments`);
  }

  const trimmed = url.trim();

  if (trimmed.startsWith(`${config.appPaymentScheme}://`)) {
    throw new Error(`${label} cannot use the mobile app callback scheme`);
  }

  if (config.appPaymentSchemes.some((scheme) => trimmed.startsWith(`${scheme}://`))) {
    throw new Error(`${label} cannot use a mobile app callback URL`);
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Invalid ${label}`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${label} must use http or https`);
  }

  const allowedOrigins = getAllowedWebsiteOrigins();
  const isPermissiveCors = config.corsOrigins === true;

  if (
    !isPermissiveCors &&
    allowedOrigins.size > 0 &&
    !allowedOrigins.has(parsed.origin)
  ) {
    throw new Error(`${label} is not allowed for website payments`);
  }

  return trimmed;
}

function isAllowedAppCallbackUrl(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim().toLowerCase();

  if (/^https?:\/\//i.test(trimmed)) {
    return false;
  }

  return config.appPaymentSchemes.some((scheme) =>
    trimmed.startsWith(`${scheme.toLowerCase()}://`)
  );
}

function assertAppCallbackUrl(url, label) {
  if (!url || typeof url !== "string") {
    throw new Error(`${label} is required for app payments`);
  }

  const trimmed = url.trim();

  if (!isAllowedAppCallbackUrl(trimmed)) {
    throw new Error(
      `${label} must use an allowed app callback scheme (${config.appPaymentSchemes.join(", ")}://)`
    );
  }

  return trimmed;
}

export function validatePlatformCheckoutPayload(platform, payload = {}) {
  const normalizedPlatform = normalizePlatform(platform);
  const { returnUrl, cancelUrl } = payload;

  if (isAppPlatform(normalizedPlatform)) {
    return {
      platform: normalizedPlatform,
      returnUrl: assertAppCallbackUrl(returnUrl, "returnUrl"),
      cancelUrl: cancelUrl
        ? assertAppCallbackUrl(cancelUrl, "cancelUrl")
        : assertAppCallbackUrl(returnUrl, "returnUrl"),
    };
  }

  return {
    platform: normalizedPlatform,
    returnUrl: assertHttpWebsiteUrl(returnUrl, "returnUrl"),
    cancelUrl: cancelUrl
      ? assertHttpWebsiteUrl(cancelUrl, "cancelUrl")
      : assertHttpWebsiteUrl(returnUrl, "returnUrl"),
  };
}

export function resolveCheckoutApiBaseUrl(platform, apiPublicUrl) {
  const normalizedPlatform = normalizePlatform(platform);

  if (isAppPlatform(normalizedPlatform)) {
    const candidate =
      (typeof apiPublicUrl === "string" && apiPublicUrl.trim()) ||
      config.apiPublicUrl ||
      `http://localhost:${config.port}`;

    return candidate.replace(/\/$/, "");
  }

  return (
    config.apiPublicUrl || `http://localhost:${config.port}`
  ).replace(/\/$/, "");
}

export function sanitizeCheckoutSessionResponse(result) {
  if (!result) return result;

  return {
    success: result.success,
    sessionId: result.sessionId,
    checkoutUrl: result.checkoutUrl,
    payableAmount: result.payableAmount,
    expiresAt: result.expiresAt,
  };
}

/** @deprecated Website create-order kept for backward compatibility; use checkout-session */
export function assertWebsiteOnlyCreateOrder(platform) {
  if (isAppPlatform(platform)) {
    throw new Error(
      "Mobile app payments must use /payment/checkout-session"
    );
  }
}

export function assertPlatformMatchesSession(requestedPlatform, sessionPlatform) {
  const requested = normalizePlatform(requestedPlatform);
  const session = normalizePlatform(sessionPlatform);

  if (requested !== session) {
    throw new Error("Payment platform mismatch for this checkout session");
  }
}
