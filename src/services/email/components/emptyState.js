import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";

/**
 * Beautiful empty state block for emails with no items/data.
 */
export const renderEmptyState = ({
  icon = "📭",
  title = "Nothing to show yet",
  message = "We'll update you as soon as there is something new.",
} = {}) => {
  const { colors, typography, layout } = BRAND;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
  <tr>
    <td align="center" style="background-color:${colors.background};border:1px dashed ${colors.border};border-radius:${layout.borderRadius};padding:32px 24px;font-family:${typography.fontFamily};">
      <div style="font-size:32px;line-height:1;margin-bottom:12px;">${icon}</div>
      <div style="font-size:${typography.fontSizeLg};font-weight:700;color:${colors.primary};margin-bottom:8px;">${escapeHtml(title)}</div>
      <div style="font-size:${typography.fontSizeSm};color:${colors.textMuted};line-height:1.6;max-width:360px;margin:0 auto;">${escapeHtml(message)}</div>
    </td>
  </tr>
</table>`.trim();
};
