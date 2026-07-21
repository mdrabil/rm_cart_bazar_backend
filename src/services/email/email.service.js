import { sendEmail } from "../../constants/mailer.js";
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
 * Send a branded template email via Nodemailer.
 *
 * @param {object} options
 * @param {string} options.type - EMAIL_TYPE value
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {object} [options.data] - Template data
 * @param {string} [options.subject] - Optional subject override
 * @param {string} [options.from] - Optional from override
 * @param {string[]} [options.cc]
 * @param {string[]} [options.bcc]
 * @param {object[]} [options.attachments] - Nodemailer attachments
 * @returns {Promise<boolean>}
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
    from: from || config.emailUser,
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
 * Fire-and-forget template email (non-blocking).
 */
export const sendTemplateEmailAsync = (options) => {
  setImmediate(() => {
    sendTemplateEmail(options).catch((err) => {
      console.error(
        `[Email] Failed to send ${options.type} to ${options.to}:`,
        err.message
      );
    });
  });
};

export { EMAIL_TYPE, emailTemplates, renderEmailTemplate as default };
