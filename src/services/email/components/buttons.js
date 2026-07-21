import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";

/**
 * Primary CTA button — brand secondary (#990000).
 */
export const renderPrimaryButton = ({
  label,
  href,
  align = "center",
  fullWidth = false,
} = {}) => {
  if (!label || !href) return "";
  const { colors, typography, layout } = BRAND;
  const width = fullWidth ? "100%" : "auto";

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" width="${fullWidth ? "100%" : "auto"}" style="width:${width};">
  <tr>
    <td align="center" style="border-radius:${layout.borderRadiusSm};background-color:${colors.secondary};">
      <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:${typography.fontFamily};font-size:${typography.fontSizeBase};font-weight:700;color:${colors.white};text-decoration:none;border-radius:${layout.borderRadiusSm};line-height:1.2;letter-spacing:0.2px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`.trim();
};

/**
 * Secondary outline CTA button.
 */
export const renderSecondaryButton = ({
  label,
  href,
  align = "center",
  fullWidth = false,
} = {}) => {
  if (!label || !href) return "";
  const { colors, typography, layout } = BRAND;
  const width = fullWidth ? "100%" : "auto";

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" width="${fullWidth ? "100%" : "auto"}" style="width:${width};">
  <tr>
    <td align="center" style="border-radius:${layout.borderRadiusSm};border:2px solid ${colors.primary};background-color:${colors.white};">
      <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 26px;font-family:${typography.fontFamily};font-size:${typography.fontSizeBase};font-weight:600;color:${colors.primary};text-decoration:none;border-radius:${layout.borderRadiusSm};line-height:1.2;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`.trim();
};
