import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";

/**
 * Rounded info card for grouped content.
 */
export const renderInfoCard = ({
  title = "",
  content = "",
  footer = "",
  backgroundColor = BRAND.colors.background,
} = {}) => {
  const { colors, typography, layout } = BRAND;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;background-color:${backgroundColor};border:1px solid ${colors.border};border-radius:${layout.borderRadius};overflow:hidden;">
  <tr>
    <td style="padding:${layout.paddingSm} ${layout.padding};font-family:${typography.fontFamily};">
      ${
        title
          ? `<div style="font-size:${typography.fontSizeSm};font-weight:700;color:${colors.primary};text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">${escapeHtml(title)}</div>`
          : ""
      }
      <div style="font-size:${typography.fontSizeBase};color:${colors.text};line-height:1.7;">${content}</div>
      ${
        footer
          ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid ${colors.border};font-size:${typography.fontSizeSm};color:${colors.textMuted};line-height:1.6;">${footer}</div>`
          : ""
      }
    </td>
  </tr>
</table>`.trim();
};

/**
 * Key-value row inside info cards / tables.
 */
export const renderKeyValueRow = ({
  label,
  value,
  valueColor = BRAND.colors.text,
  bold = false,
} = {}) => {
  const { colors, typography } = BRAND;
  return `
<tr>
  <td style="padding:8px 0;font-family:${typography.fontFamily};font-size:${typography.fontSizeSm};color:${colors.textMuted};vertical-align:top;width:42%;">${escapeHtml(label)}</td>
  <td style="padding:8px 0;font-family:${typography.fontFamily};font-size:${typography.fontSizeSm};color:${valueColor};vertical-align:top;text-align:right;font-weight:${bold ? "700" : "500"};">${value}</td>
</tr>`.trim();
};
