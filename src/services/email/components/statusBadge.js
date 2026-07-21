import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";

const STATUS_COLORS = {
  success: { bg: "#ECFDF5", text: BRAND.colors.success, border: "#BBF7D0" },
  warning: { bg: "#FFFBEB", text: BRAND.colors.warning, border: "#FDE68A" },
  danger: { bg: "#FEF2F2", text: BRAND.colors.danger, border: "#FECACA" },
  info: { bg: "#EFF6FF", text: BRAND.colors.info, border: "#BFDBFE" },
  neutral: { bg: BRAND.colors.background, text: BRAND.colors.primary, border: BRAND.colors.border },
  primary: { bg: "#EEF2FF", text: BRAND.colors.primary, border: "#C7D2FE" },
};

/**
 * Status badge pill for order/payment states.
 */
export const renderStatusBadge = ({
  label,
  type = "neutral",
  align = "center",
} = {}) => {
  if (!label) return "";
  const palette = STATUS_COLORS[type] || STATUS_COLORS.neutral;
  const { typography, layout } = BRAND;

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}">
  <tr>
    <td style="background-color:${palette.bg};border:1px solid ${palette.border};border-radius:999px;padding:6px 14px;font-family:${typography.fontFamily};font-size:${typography.fontSizeXs};font-weight:700;color:${palette.text};text-transform:uppercase;letter-spacing:0.5px;line-height:1.2;">
      ${escapeHtml(label)}
    </td>
  </tr>
</table>`.trim();
};

/**
 * Stock status badge — In Stock / Out of Stock (reusable in emails).
 */
export const renderStockBadge = ({
  inStock = true,
  inStockLabel = "In Stock",
  outOfStockLabel = "Out of Stock",
} = {}) =>
  renderStatusBadge({
    label: inStock ? inStockLabel : outOfStockLabel,
    type: inStock ? "success" : "danger",
    align: "left",
  });
