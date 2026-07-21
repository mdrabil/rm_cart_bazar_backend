export { escapeHtml, nl2br } from "./escape.js";
export {
  formatCurrency,
  formatDate,
  formatAddress,
  formatPlainAddress,
} from "./formatters.js";
export { PLACEHOLDERS, SAMPLE_ORDER } from "./placeholders.js";

/**
 * Build a standard email payload { subject, html, text }.
 */
export const buildEmailPayload = ({ subject, html, text }) => ({
  subject: String(subject || "").trim(),
  html: String(html || ""),
  text: text ? String(text) : stripHtml(html),
});

const stripHtml = (html = "") =>
  String(html)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
