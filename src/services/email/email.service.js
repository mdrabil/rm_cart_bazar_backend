import { sendEmail, sendEmailAsync, verifyEmailTransport } from "../../constants/mailer.js";
import { config } from "../../config/config.js";
import { EMAIL_TYPE } from "./types.js";
import emailTemplates from "./templates/index.js";

/**
 * Render an email template by type without sending.
 *
 * @param {string} type - EMAIL_TYPE value
 * @param {object} data - Template-specific dynamic data
 * @returns {{ subject: string, html: string, text: string }}
 */
export const renderEmailTemplate = (type, data = {}) => {
  const builder = emailTemplates[type];
  if (!builder) {
    throw new Error(`Unknown email template type: ${type}`);
  }
  return builder({
    website: config.websiteUrl,
    adminPanelUrl: config.adminPanelUrl,
    ...data,
  });
};

/**
 * Send a branded template email via Nodemailer (awaits with hard SMTP timeout).
 */
export const sendTemplateEmail = async ({
  type,
  to,
  data = {},
  subject: subjectOverride,
  from,
  cc,
  bcc,
  attachments,
}) => {
  const payload = renderEmailTemplate(type, data);

  return sendEmail({
    from: from || `"MR Crafted" <${config.emailUser}>`,
    to,
    cc,
    bcc,
    subject: subjectOverride || payload.subject,
    html: payload.html,
    text: payload.text,
    attachments,
  });
};

/**
 * Fire-and-forget template email (non-blocking — use for non-critical mail).
 * OTP flows should prefer await sendTemplateEmail so failures are visible.
 */
export const sendTemplateEmailAsync = (options) => {
  setImmediate(() => {
    sendTemplateEmail(options).catch((err) => {
      console.error(
        `[Email] Failed to send ${options.type} to ${options.to}:`,
        err.code || "",
        err.message
      );
    });
  });
};

export {
  EMAIL_TYPE,
  emailTemplates,
  sendEmail,
  sendEmailAsync,
  verifyEmailTransport,
  renderEmailTemplate as default,
};
