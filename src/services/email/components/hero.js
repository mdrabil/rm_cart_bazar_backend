import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";

/**
 * Premium hero section with optional status badge.
 */
export const renderHero = ({
  title,
  subtitle = "",
  eyebrow = "",
  align = "center",
  backgroundColor = BRAND.colors.primary,
  textColor = BRAND.colors.white,
  badge = null,
} = {}) => {
  const { typography, layout } = BRAND;

  const badgeHtml = badge
    ? `<tr><td align="${align}" style="padding-bottom:12px;">${badge}</td></tr>`
    : "";

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${backgroundColor};">
  <tr>
    <td align="${align}" style="padding:${layout.paddingLg} ${layout.padding};font-family:${typography.fontFamily};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${badgeHtml}
        ${
          eyebrow
            ? `<tr><td align="${align}" style="font-size:${typography.fontSizeXs};font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,255,255,0.75);padding-bottom:8px;">${escapeHtml(eyebrow)}</td></tr>`
            : ""
        }
        <tr>
          <td align="${align}" style="font-size:${typography.fontSizeXl};font-weight:700;color:${textColor};line-height:1.25;">
            ${escapeHtml(title)}
          </td>
        </tr>
        ${
          subtitle
            ? `<tr><td align="${align}" style="padding-top:10px;font-size:${typography.fontSizeBase};color:rgba(255,255,255,0.88);line-height:1.6;">${subtitle}</td></tr>`
            : ""
        }
      </table>
    </td>
  </tr>
</table>`.trim();
};
