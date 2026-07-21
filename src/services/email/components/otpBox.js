import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";

/**
 * Large OTP display box with optional expiry & security note.
 */
export const renderOtpBox = ({
  otp,
  expiryMinutes = 10,
  securityNote = "Never share this code with anyone. MR Crafted will never ask for your OTP.",
} = {}) => {
  const { colors, typography, layout } = BRAND;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.background};border:2px dashed ${colors.border};border-radius:${layout.borderRadius};">
        <tr>
          <td align="center" style="padding:28px 40px;font-family:${typography.fontFamily};">
            <div style="font-size:${typography.fontSizeSm};color:${colors.textMuted};text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:10px;">Your Verification Code</div>
            <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:${colors.primary};line-height:1.2;">${escapeHtml(otp)}</div>
            <div style="margin-top:12px;font-size:${typography.fontSizeSm};color:${colors.textMuted};">Expires in <strong style="color:${colors.secondary};">${escapeHtml(expiryMinutes)} minutes</strong></div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top:14px;font-family:${typography.fontFamily};font-size:${typography.fontSizeXs};color:${colors.textMuted};line-height:1.6;text-align:center;">
      &#128274; ${escapeHtml(securityNote)}
    </td>
  </tr>
</table>`.trim();
};
