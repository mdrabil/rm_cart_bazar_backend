import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";

/**
 * Branded email header — dark navy background with logo & website link.
 */
export const renderHeader = ({
  companyName = BRAND.companyName,
  website = BRAND.website,
  logoUrl = BRAND.logoUrl,
  logoAlt = BRAND.logoAlt,
} = {}) => {
  const { colors, typography, layout } = BRAND;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.primary};border-radius:${layout.borderRadius} ${layout.borderRadius} 0 0;">
  <tr>
    <td align="center" style="padding:28px ${layout.padding};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding-bottom:12px;">
            <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(logoAlt)}" width="72" height="72" style="display:block;border:0;outline:none;border-radius:12px;max-width:72px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family:${typography.fontFamily};font-size:22px;font-weight:700;color:${colors.white};letter-spacing:0.3px;line-height:1.3;">
            ${escapeHtml(companyName)}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:6px;font-family:${typography.fontFamily};font-size:${typography.fontSizeSm};color:rgba(255,255,255,0.82);line-height:1.5;">
            <a href="${escapeHtml(website)}" style="color:rgba(255,255,255,0.92);text-decoration:none;">${escapeHtml(website.replace(/^https?:\/\//, ""))}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
};
