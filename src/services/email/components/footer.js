import { BRAND, getBrandUrls } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";
import { renderSocialIcons } from "./socialIcons.js";

/**
 * Branded email footer with contact, social, legal links & copyright.
 */
export const renderFooter = ({
  companyName = BRAND.companyName,
  website = BRAND.website,
  supportEmail = BRAND.supportEmail,
  phone = BRAND.phone,
  year = new Date().getFullYear(),
  social = BRAND.social,
  legal = BRAND.legal,
} = {}) => {
  const { colors, typography, layout } = BRAND;
  const urls = getBrandUrls({ website });

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.white};border-top:1px solid ${colors.border};border-radius:0 0 ${layout.borderRadius} ${layout.borderRadius};">
  <tr>
    <td style="padding:${layout.padding};font-family:${typography.fontFamily};">
      ${renderDivider({ marginTop: "0", marginBottom: "20px" })}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding-bottom:16px;">
            ${renderSocialIcons({ social })}
          </td>
        </tr>
        <tr>
          <td align="center" style="font-size:${typography.fontSizeSm};color:${colors.textMuted};line-height:1.8;">
            <a href="${escapeHtml(urls.website)}" style="color:${colors.primary};text-decoration:none;font-weight:600;">Website</a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="mailto:${escapeHtml(supportEmail)}" style="color:${colors.primary};text-decoration:none;">${escapeHtml(supportEmail)}</a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="tel:${escapeHtml(phone.replace(/\s/g, ""))}" style="color:${colors.primary};text-decoration:none;">${escapeHtml(phone)}</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:12px;font-size:${typography.fontSizeXs};color:${colors.textMuted};line-height:1.8;">
            <a href="${escapeHtml(legal.privacyPolicy)}" style="color:${colors.textMuted};text-decoration:underline;">Privacy Policy</a>
            &nbsp;&nbsp;•&nbsp;&nbsp;
            <a href="${escapeHtml(legal.termsConditions)}" style="color:${colors.textMuted};text-decoration:underline;">Terms &amp; Conditions</a>
            &nbsp;&nbsp;•&nbsp;&nbsp;
            <a href="${escapeHtml(legal.refundPolicy)}" style="color:${colors.textMuted};text-decoration:underline;">Refund Policy</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:18px;font-size:${typography.fontSizeXs};color:${colors.textMuted};line-height:1.6;">
            &copy; ${year} ${escapeHtml(companyName)}. All rights reserved.<br />
            Custom Printing &amp; Personalized Products — designed with care, printed with precision.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
};

export const renderDivider = ({
  color = BRAND.colors.border,
  marginTop = "24px",
  marginBottom = "24px",
} = {}) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:${marginTop};margin-bottom:${marginBottom};">
  <tr>
    <td style="border-top:1px solid ${color};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`.trim();
