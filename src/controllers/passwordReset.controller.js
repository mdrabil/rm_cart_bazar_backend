import {
  requestPasswordReset,
  verifyResetToken,
  resetPasswordWithToken,
} from "../services/passwordReset.service.js";
import {
  forgotPasswordSchema,
  verifyResetTokenSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const GENERIC_FORGOT_MESSAGE =
  "If an account with that email exists, a password reset link has been sent.";

export const forgotPassword = async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0]?.message || "Invalid request",
      });
    }

    try {
      await requestPasswordReset(value.email);
    } catch (mailErr) {
      console.error("FORGOT PASSWORD EMAIL ERROR:", mailErr.message);
      return res.status(503).json({
        success: false,
        message: "Unable to send reset email right now. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: GENERIC_FORGOT_MESSAGE,
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const verifyPasswordResetToken = async (req, res) => {
  try {
    const token = req.params.token || req.body?.token;
    const { error } = verifyResetTokenSchema.validate({ token });

    if (error) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: error.details[0]?.message || "Invalid token",
      });
    }

    const result = await verifyResetToken(token);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Invalid or expired reset link",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      email: result.email,
      fullName: result.fullName,
    });
  } catch (err) {
    console.error("VERIFY RESET TOKEN ERROR:", err);
    return res.status(500).json({
      success: false,
      valid: false,
      message: "Unable to verify reset link",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0]?.message || "Invalid request",
      });
    }

    const result = await resetPasswordWithToken(value.token, value.password);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. You can now sign in.",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to reset password. Please try again.",
    });
  }
};
