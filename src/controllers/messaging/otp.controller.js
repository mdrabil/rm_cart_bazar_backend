import Messaging from "../../messaging/index.js";
import Customer from "../../models/Customer.js";
import MailVarificationModel from "../../models/MailVarification.model.js";
import OtpVerification from "../../models/OtpVerification.model.js";
import MessageProvider, {
  MESSAGE_PROVIDER_STATUS,
} from "../../models/MessageProvider.model.js";
import jwt from "jsonwebtoken";
import { config } from "../../config/config.js";

/**
 * Resolve which OTP identifier types are available from ACTIVE MessageProviders.
 * No provider names / credentials exposed.
 */
async function resolveActiveOtpChannels() {
  const providers = await MessageProvider.find({
    status: MESSAGE_PROVIDER_STATUS.ACTIVE,
  })
    .select("supportedChannels")
    .lean();

  const channels = new Set();
  for (const provider of providers) {
    for (const channel of provider.supportedChannels || []) {
      channels.add(String(channel).toLowerCase());
    }
  }

  const emailEnabled = channels.has("email");
  const phoneEnabled = channels.has("sms") || channels.has("whatsapp");

  return {
    emailEnabled,
    phoneEnabled,
    verificationRequired: emailEnabled || phoneEnabled,
  };
}

/**
 * POST /api/auth/send-otp — send OTP
 * GET  /api/auth/send-otp — active channels from MessageProvider (signup UI)
 *
 * Frontend must NOT send provider, channel, or identifierType.
 */
export const sendAuthOtp = async (req, res) => {
  // Existing auth OTP route — GET returns active channels for dynamic signup buttons
  if (req.method === "GET") {
    try {
      const active = await resolveActiveOtpChannels();
      return res.status(200).json({
        success: true,
        ...active,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to load OTP channels",
        emailEnabled: false,
        phoneEnabled: false,
        verificationRequired: false,
      });
    }
  }

  try {
    const {
      identifier,
      purpose = "signup",
      countryCode,
      // legacy aliases — still accepted, mapped to identifier only
      email,
      mobile,
    } = req.body || {};

    let { customerName } = req.body || {};

    const raw = identifier || email || mobile;
    if (!raw) {
      return res.status(400).json({
        success: false,
        message: "identifier is required",
      });
    }

    const identity = Messaging.detectIdentifier(raw);

    // Enforce admin-configured active channels
    const active = await resolveActiveOtpChannels();
    if (identity.identifierType === "email" && !active.emailEnabled) {
      return res.status(400).json({
        success: false,
        message: "Email verification is not available",
      });
    }
    if (identity.identifierType === "mobile" && !active.phoneEnabled) {
      return res.status(400).json({
        success: false,
        message: "Phone verification is not available",
      });
    }

    if (purpose === "signup") {
      if (identity.identifierType === "email") {
        const exists = await Customer.findOne({ email: identity.identifier });
        if (exists) {
          return res.status(400).json({
            success: false,
            message: "Email already registered",
          });
        }

        const alreadyVerified = await Messaging.isIdentifierVerified({
          identifier: identity.identifier,
          purpose: "signup",
        });
        if (alreadyVerified) {
          await MailVarificationModel.findOneAndUpdate(
            { email: identity.identifier },
            {
              email: identity.identifier,
              otp: "VERIFIED",
              verified: true,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
            { upsert: true }
          );
          return res.status(200).json({
            success: true,
            verified: true,
            message: "Already verified",
          });
        }
      } else {
        const exists = await Customer.findOne({ mobile: identity.identifier });
        if (exists) {
          return res.status(400).json({
            success: false,
            message: "Mobile number already registered",
          });
        }

        const alreadyVerified = await Messaging.isIdentifierVerified({
          identifier: identity.identifier,
          purpose: "signup",
        });
        if (alreadyVerified) {
          return res.status(200).json({
            success: true,
            verified: true,
            message: "Already verified",
          });
        }
      }
    }

    if (purpose === "password_reset" || purpose === "login") {
      const query =
        identity.identifierType === "email"
          ? { email: identity.identifier }
          : { mobile: identity.identifier };
      const user = await Customer.findOne(query);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      if (!customerName) {
        customerName = user.fullName || "Customer";
      }
    }

    const result = await Messaging.sendOTP({
      identifier: identity.identifier,
      purpose,
      countryCode,
      customerName: customerName || "Customer",
    });

    // Keep legacy MailVarification in sync for createCustomer email gate
    if (purpose === "signup" && identity.identifierType === "email") {
      const session = await OtpVerification.findById(result.sessionId);
      await MailVarificationModel.findOneAndDelete({
        email: identity.identifier,
      });
      await MailVarificationModel.create({
        email: identity.identifier,
        otp: session?.otp || "PENDING",
        verified: false,
        expiresAt:
          session?.expiresAt || new Date(Date.now() + 5 * 60 * 1000),
      });
    }

    return res.status(200).json({
      success: true,
      sessionId: result.sessionId,
      message: result.message || "OTP sent successfully",
      ...(result.expiresInSeconds
        ? { expiresInSeconds: result.expiresInSeconds }
        : {}),
    });
  } catch (error) {
    console.error("[Auth OTP] send error:", error.code || "", error.message);
    const status =
      error.status ||
      (error.code === "EMAIL_TIMEOUT" ||
      error.code === "ESOCKET" ||
      error.code === "ECONNECTION"
        ? 503
        : 500);
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to send OTP",
      code: error.code || "OTP_SEND_FAILED",
    });
  }
};

/**
 * POST /api/auth/verify-otp
 * Body: { sessionId, otp }
 */
export const verifyAuthOtp = async (req, res) => {
  try {
    const {
      sessionId,
      otp,
      code,
      purpose,
      // legacy — only used if sessionId missing
      identifier,
      email,
      mobile,
    } = req.body || {};

    if (!sessionId && !(identifier || email || mobile)) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required",
      });
    }

    const result = await Messaging.verifyOTP({
      sessionId,
      otp,
      code,
      purpose,
      identifier,
      email,
      mobile,
    });

    // Signup email gate compatibility
    if (
      result.purpose === "signup" &&
      result.identifierType === "email"
    ) {
      await MailVarificationModel.findOneAndUpdate(
        { email: result.identifier },
        {
          email: result.identifier,
          otp: String(otp || code || "VERIFIED"),
          verified: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        { upsert: true }
      );
    }

    // Forgot-password: issue short-lived reset token (frontend already expects this)
    let resetToken;
    if (result.purpose === "password_reset") {
      resetToken = jwt.sign(
        {
          email:
            result.identifierType === "email" ? result.identifier : undefined,
          mobile:
            result.identifierType === "mobile" ? result.identifier : undefined,
          identifier: result.identifier,
          identifierType: result.identifierType,
          purpose: "customer-password-reset",
        },
        config.jwtSecret,
        { expiresIn: "15m" }
      );
    }

    return res.status(200).json({
      success: true,
      message: result.message || "OTP verified successfully",
      sessionId: result.sessionId,
      ...(resetToken ? { resetToken } : {}),
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || "OTP verification failed",
      attemptsLeft: error.attemptsLeft,
    });
  }
};
