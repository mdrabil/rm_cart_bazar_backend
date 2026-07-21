import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";

const ALERT_STYLES = {
  success: {
    bg: "#ECFDF5",
    border: "#BBF7D0",
    text: "#166534",
    icon: "✓",
  },
  warning: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    text: "#92400E",
    icon: "⚠",
  },
  error: {
    bg: "#FEF2F2",
    border: "#FECACA",
    text: "#991B1B",
    icon: "✕",
  },
  info: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1E40AF",
    icon: "ℹ",
  },
};

/**
 * Success / warning / error alert box.
 */
export const renderAlertBox = ({
  type = "info",
  title = "",
  message = "",
} = {}) => {
  const style = ALERT_STYLES[type] || ALERT_STYLES.info;
  const { typography, layout } = BRAND;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
  <tr>
    <td style="background-color:${style.bg};border:1px solid ${style.border};border-radius:${layout.borderRadiusSm};padding:14px 16px;font-family:${typography.fontFamily};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="28" valign="top" style="font-size:16px;color:${style.text};line-height:1.4;">${style.icon}</td>
          <td valign="top">
            ${
              title
                ? `<div style="font-size:${typography.fontSizeBase};font-weight:700;color:${style.text};margin-bottom:4px;">${escapeHtml(title)}</div>`
                : ""
            }
            <div style="font-size:${typography.fontSizeSm};color:${style.text};line-height:1.6;">${message}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
};
