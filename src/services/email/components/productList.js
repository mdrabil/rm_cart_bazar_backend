import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";
import { formatCurrency } from "../helpers/formatters.js";
import { renderEmptyState } from "./emptyState.js";

/**
 * Product list table with image, customization preview, qty & price.
 */
export const renderProductList = ({ items = [] } = {}) => {
  if (!items.length) {
    return renderEmptyState({
      icon: "🛍️",
      title: "No products in this order",
      message: "Product details will appear here once items are added.",
    });
  }

  const { colors, typography, layout } = BRAND;

  const rows = items
    .map((item, index) => {
      const image = item.productImage || item.image || item.thumbnail;
      const customization =
        item.customizationPreview || item.customizationImage || item.layerPreview;
      const qty = item.quantity ?? item.qty ?? 1;
      const price = formatCurrency(item.price ?? item.sellingPrice ?? item.total);
      const name = item.productName || item.name || "Product";

      return `
<tr>
  <td style="padding:16px 0;${index > 0 ? `border-top:1px solid ${colors.border};` : ""}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="72" valign="top" style="padding-right:12px;">
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:${layout.borderRadiusSm};border:1px solid ${colors.border};background-color:${colors.background};" />`
              : `<table role="presentation" width="72" height="72" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" style="width:72px;height:72px;background-color:${colors.background};border:1px solid ${colors.border};border-radius:${layout.borderRadiusSm};font-size:24px;">🎨</td></tr></table>`
          }
        </td>
        <td valign="top">
          <div style="font-family:${typography.fontFamily};font-size:${typography.fontSizeBase};font-weight:700;color:${colors.text};line-height:1.4;margin-bottom:6px;">${escapeHtml(name)}</div>
          <div style="font-family:${typography.fontFamily};font-size:${typography.fontSizeSm};color:${colors.textMuted};line-height:1.5;">
            Qty: <strong style="color:${colors.text};">${escapeHtml(qty)}</strong>
            &nbsp;&nbsp;•&nbsp;&nbsp;
            Price: <strong style="color:${colors.secondary};">${price}</strong>
          </div>
          ${
            customization
              ? `<div style="margin-top:10px;">
                  <div style="font-size:${typography.fontSizeXs};color:${colors.textMuted};text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;">Customization Preview</div>
                  <img src="${escapeHtml(customization)}" alt="Customization preview" width="120" style="display:block;max-width:120px;height:auto;border-radius:${layout.borderRadiusSm};border:1px solid ${colors.border};" />
                </div>`
              : ""
          }
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    })
    .join("");

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;background-color:${colors.white};border:1px solid ${colors.border};border-radius:${layout.borderRadius};overflow:hidden;">
  <tr>
    <td style="padding:14px ${layout.padding};background-color:${colors.background};font-family:${typography.fontFamily};font-size:${typography.fontSizeSm};font-weight:700;color:${colors.primary};text-transform:uppercase;letter-spacing:0.5px;">
      Your Products
    </td>
  </tr>
  <tr>
    <td style="padding:0 ${layout.padding} 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>
    </td>
  </tr>
</table>`.trim();
};

/**
 * Pricing totals block (subtotal, shipping, tax, grand total).
 */
export const renderPricingTotals = ({
  subtotal,
  shipping,
  tax,
  discount,
  grandTotal,
} = {}) => {
  const { colors, typography, layout } = BRAND;

  const rows = [
    subtotal != null && { label: "Subtotal", value: formatCurrency(subtotal) },
    shipping != null && { label: "Shipping", value: formatCurrency(shipping) },
    tax != null && { label: "Tax", value: formatCurrency(tax) },
    discount != null &&
      Number(discount) > 0 && {
        label: "Discount",
        value: `-${formatCurrency(discount)}`,
        color: colors.success,
      },
  ].filter(Boolean);

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;background-color:${colors.background};border:1px solid ${colors.border};border-radius:${layout.borderRadius};">
  <tr>
    <td style="padding:${layout.padding};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${typography.fontFamily};">
        ${rows
          .map(
            (row) => `
        <tr>
          <td style="padding:6px 0;font-size:${typography.fontSizeSm};color:${colors.textMuted};">${escapeHtml(row.label)}</td>
          <td align="right" style="padding:6px 0;font-size:${typography.fontSizeSm};color:${row.color || colors.text};font-weight:600;">${row.value}</td>
        </tr>`
          )
          .join("")}
        ${
          grandTotal != null
            ? `
        <tr>
          <td colspan="2" style="padding-top:12px;border-top:2px solid ${colors.border};"></td>
        </tr>
        <tr>
          <td style="padding-top:8px;font-size:${typography.fontSizeBase};font-weight:700;color:${colors.primary};">Grand Total</td>
          <td align="right" style="padding-top:8px;font-size:${typography.fontSizeLg};font-weight:800;color:${colors.secondary};">${formatCurrency(grandTotal)}</td>
        </tr>`
            : ""
        }
      </table>
    </td>
  </tr>
</table>`.trim();
};
