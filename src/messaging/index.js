/**
 * Messaging orchestrator — provider-independent entry point.
 *
 * Frontend only sends `identifier`. Backend detects type, loads active
 * provider from MessageProvider collection, and sends/verifies OTP.
 *
 *   await Messaging.sendOTP({ identifier: "a@b.com", purpose: "signup" });
 *   await Messaging.verifyOTP({ sessionId, otp: "123456" });
 *   await Messaging.notify({ to: "a@b.com", type: EMAIL_TYPE.ORDER_PLACED, data: {} });
 */

import OtpVerification from "../models/OtpVerification.model.js";
import MessageProviderFactory from "./factory.js";
import { EMAIL_TYPE, sendTemplateEmail } from "../services/email/email.service.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeMobile = (mobile) => String(mobile || "").replace(/\D/g, "");

const generateLocalOtp = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};

/**
 * Detect identifier type from value alone — no frontend channel/provider input.
 */
export function detectIdentifier(raw) {
  const value = String(raw || "").trim();
  if (!value) {
    throw Object.assign(new Error("identifier is required"), { status: 400 });
  }

  if (value.includes("@")) {
    const email = normalizeEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw Object.assign(new Error("Invalid email address"), { status: 400 });
    }
    return {
      identifierType: "email",
      identifier: email,
      email,
      mobile: null,
    };
  }

  const mobile = normalizeMobile(value);
  if (!mobile || mobile.length < 8 || mobile.length > 15) {
    throw Object.assign(new Error("Valid mobile number is required"), {
      status: 400,
    });
  }

  return {
    identifierType: "mobile",
    identifier: mobile,
    email: null,
    mobile,
  };
}

async function replaceOtpSession(payload) {
  await OtpVerification.deleteMany({
    identifier: payload.identifier,
    purpose: payload.purpose,
    channel: payload.channel,
  });

  return OtpVerification.create(payload);
}

/**
 * Send OTP — only `identifier` is required from callers.
 * Provider + channel are chosen from DB (default → priority).
 */
export async function sendOTP({
  identifier,
  purpose = "signup",
  countryCode,
  customerName,
  otpLength = 6,
  // legacy optional fields (ignored for selection; used only if identifier missing)
  email,
  mobile,
} = {}) {
  const raw = identifier || email || mobile;
  const identity = detectIdentifier(raw);

  const { doc, service, channel } =
    await MessageProviderFactory.getActiveForIdentifierType(
      identity.identifierType
    );

  const needsLocalOtp = channel === "email";
  const localOtp = needsLocalOtp ? generateLocalOtp(otpLength) : null;

  const sendResult = await service.sendOtp({
    channel,
    email: identity.email,
    mobile: identity.mobile,
    otp: localOtp,
    otpExpiryMinutes: 5,
    customerName,
    countryCode,
    otpLength,
  });

  const session = await replaceOtpSession({
    identifier: identity.identifier,
    identifierType: identity.identifierType,
    channel,
    purpose,
    otp: sendResult.providerGeneratesOtp ? null : localOtp,
    verificationId: sendResult.verificationId || null,
    providerName: doc.providerName,
    countryCode: countryCode || "91",
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    verified: false,
    attempts: 0,
  });

  // Public response — no provider / channel leakage to frontend
  return {
    success: true,
    message: "OTP sent successfully",
    sessionId: String(session._id),
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
  };
}

/**
 * Verify OTP by sessionId (preferred) or legacy identifier fields.
 */
export async function verifyOTP({
  sessionId,
  otp,
  code,
  purpose,
  // legacy
  identifier,
  email,
  mobile,
} = {}) {
  const otpCode = String(otp || code || "").trim();
  if (!otpCode) {
    throw Object.assign(new Error("OTP is required"), { status: 400 });
  }

  let session = null;

  if (sessionId) {
    session = await OtpVerification.findById(sessionId);
  } else {
    const raw = identifier || email || mobile;
    if (!raw) {
      throw Object.assign(new Error("sessionId is required"), { status: 400 });
    }
    const identity = detectIdentifier(raw);
    const query = {
      identifier: identity.identifier,
      identifierType: identity.identifierType,
    };
    if (purpose) query.purpose = purpose;

    session = await OtpVerification.findOne(query).sort({ createdAt: -1 });
  }

  if (!session) {
    throw Object.assign(new Error("OTP not found or expired"), { status: 400 });
  }

  if (purpose && session.purpose !== purpose) {
    throw Object.assign(new Error("OTP session purpose mismatch"), {
      status: 400,
    });
  }

  if (session.verified) {
    return {
      success: true,
      alreadyVerified: true,
      message: "Already verified",
      sessionId: String(session._id),
      identifier: session.identifier,
      identifierType: session.identifierType,
      purpose: session.purpose,
    };
  }

  if (session.expiresAt < new Date()) {
    await session.deleteOne();
    throw Object.assign(new Error("OTP expired"), { status: 400 });
  }

  if (session.attempts >= MAX_ATTEMPTS) {
    throw Object.assign(
      new Error("Too many invalid attempts. Request a new OTP."),
      { status: 429 }
    );
  }

  if (session.otp) {
    if (String(session.otp) !== otpCode) {
      session.attempts += 1;
      await session.save();
      throw Object.assign(new Error("Invalid OTP"), {
        status: 400,
        attemptsLeft: MAX_ATTEMPTS - session.attempts,
      });
    }
  } else {
    const { service } = await MessageProviderFactory.get(
      session.providerName
    );

    const result = await service.validateOtp({
      verificationId: session.verificationId,
      code: otpCode,
      mobile: session.identifierType === "mobile" ? session.identifier : null,
      countryCode: session.countryCode,
      storedOtp: session.otp,
    });

    if (!result.success) {
      session.attempts += 1;
      await session.save();
      throw Object.assign(new Error(result.message || "Invalid OTP"), {
        status: 400,
        attemptsLeft: MAX_ATTEMPTS - session.attempts,
      });
    }
  }

  session.verified = true;
  await session.save();

  return {
    success: true,
    message: "OTP verified successfully",
    sessionId: String(session._id),
    identifier: session.identifier,
    identifierType: session.identifierType,
    purpose: session.purpose,
  };
}

/**
 * Check if identifier was verified for a purpose (signup gate).
 */
export async function isIdentifierVerified({
  identifier,
  purpose = "signup",
} = {}) {
  const identity = detectIdentifier(identifier);

  const session = await OtpVerification.findOne({
    identifier: identity.identifier,
    identifierType: identity.identifierType,
    purpose,
    verified: true,
  }).sort({ updatedAt: -1 });

  return Boolean(session);
}

/**
 * Generic notification — selects active provider from DB by recipient type.
 * Email templates use the Email provider; mobile uses SMS/WhatsApp provider.
 */
export async function notify({
  to,
  identifier,
  type,
  data = {},
  subject,
  purpose,
} = {}) {
  const raw = to || identifier;
  const identity = detectIdentifier(raw);

  const { service, channel } =
    await MessageProviderFactory.getActiveForIdentifierType(
      identity.identifierType
    );

  if (channel === "email" && type) {
    if (typeof service.sendMessage === "function") {
      return service.sendMessage({
        type,
        to: identity.email,
        data,
        subject,
      });
    }
    // Fallback: Nodemailer templates (same stack Email provider uses)
    return sendTemplateEmail({
      type,
      to: identity.email,
      data,
      subject,
    });
  }

  if ((channel === "sms" || channel === "whatsapp") && typeof service.sendMessage === "function") {
    return service.sendMessage({
      channel,
      mobile: identity.mobile,
      type,
      data,
      purpose,
    });
  }

  // Mobile providers without generic sendMessage — OTP path only for now
  if (channel === "sms" || channel === "whatsapp") {
    throw new Error(
      "This provider does not support generic notifications yet. Use sendOTP for OTP flows."
    );
  }

  throw new Error("Unable to send notification with the active provider");
}

/** Fire-and-forget notify */
export function notifyAsync(options) {
  setImmediate(() => {
    notify(options).catch((err) => {
      console.error(
        `[Messaging] notify failed (${options?.type || "unknown"}):`,
        err.code || "",
        err.message
      );
    });
  });
}

const Messaging = {
  detectIdentifier,
  sendOTP,
  verifyOTP,
  isIdentifierVerified,
  notify,
  notifyAsync,
  EMAIL_TYPE,
  getActiveProvider: (channel) => MessageProviderFactory.getActive(channel),
  getActiveForIdentifierType: (type) =>
    MessageProviderFactory.getActiveForIdentifierType(type),
};

export default Messaging;
