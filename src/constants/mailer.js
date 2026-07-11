import nodemailer from "nodemailer";
import { config } from "../config/config.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.emailUser,
    pass: config.emailPass,
  },
});

/**
 * Send email. Supports legacy `(to, subject, text)` and object payloads.
 */
export const sendEmail = async (to, subject, text, html) => {
  let mailOptions;

  if (typeof to === "object" && to !== null && !Array.isArray(to)) {
    mailOptions = {
      from: config.emailUser,
      ...to,
    };
  } else {
    mailOptions = {
      from: config.emailUser,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    };
  }

  if (!mailOptions.to || !mailOptions.subject) {
    throw new Error("Email recipient and subject are required");
  }

  if (!config.emailUser || !config.emailPass) {
    throw new Error("Email service is not configured");
  }

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};
