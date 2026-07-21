/**
 * Escape user-supplied strings for safe HTML email output.
 */
export const escapeHtml = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const nl2br = (value) =>
  escapeHtml(value).replace(/\r?\n/g, "<br />");
