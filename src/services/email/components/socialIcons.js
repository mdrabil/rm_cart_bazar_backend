import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";

const SOCIAL_META = [
  { key: "facebook", label: "Facebook", letter: "f", bg: "#1877F2" },
  { key: "instagram", label: "Instagram", letter: "IG", bg: "#E4405F" },
  { key: "youtube", label: "YouTube", letter: "▶", bg: "#FF0000" },
  { key: "linkedin", label: "LinkedIn", letter: "in", bg: "#0A66C2" },
  { key: "whatsapp", label: "WhatsApp", letter: "W", bg: "#25D366" },
];

/**
 * Table-based social icon buttons — no external image dependencies.
 */
export const renderSocialIcons = ({ social = BRAND.social } = {}) => {
  const cells = SOCIAL_META.map(({ key, label, letter, bg }) => {
    const href = social[key];
    if (!href) return "";
    return `
      <td style="padding:0 6px;">
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}" style="text-decoration:none;display:inline-block;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" width="36" height="36" style="width:36px;height:36px;background-color:${bg};border-radius:50%;font-family:${BRAND.typography.fontFamily};font-size:11px;font-weight:700;color:#FFFFFF;line-height:36px;">
                ${letter}
              </td>
            </tr>
          </table>
        </a>
      </td>`;
  }).join("");

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
  <tr>${cells}</tr>
</table>`.trim();
};
