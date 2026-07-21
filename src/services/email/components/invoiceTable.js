import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";
import { formatCurrency, formatDate } from "../helpers/formatters.js";
import { renderProductList, renderPricingTotals } from "./productList.js";
import { renderCustomerDetailsTable } from "./orderSummaryTable.js";

/**
 * Full invoice table for billing emails.
 */
export const renderInvoiceTable = ({
  invoiceNumber,
  invoiceDate,
  dueDate,
  customerName,
  email,
  billingAddress,
  items = [],
  subtotal,
  shipping,
  tax,
  discount,
  grandTotal,
  notes = "",
} = {}) => {
  const { colors, typography, layout } = BRAND;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;background-color:${colors.white};border:1px solid ${colors.border};border-radius:${layout.borderRadius};overflow:hidden;">
  <tr>
    <td style="padding:${layout.padding};background:linear-gradient(135deg, ${colors.primary} 0%, #002a6b 100%);font-family:${typography.fontFamily};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:${typography.fontSizeLg};font-weight:800;color:${colors.white};">INVOICE</td>
          <td align="right" style="font-size:${typography.fontSizeSm};color:rgba(255,255,255,0.85);line-height:1.6;">
            ${invoiceNumber ? `#${escapeHtml(invoiceNumber)}<br />` : ""}
            ${invoiceDate ? `Date: ${formatDate(invoiceDate)}<br />` : ""}
            ${dueDate ? `Due: ${formatDate(dueDate)}` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:${layout.padding};font-family:${typography.fontFamily};">
      ${
        customerName
          ? `<div style="font-size:${typography.fontSizeSm};color:${colors.textMuted};margin-bottom:4px;">Billed To</div>
             <div style="font-size:${typography.fontSizeBase};font-weight:700;color:${colors.text};margin-bottom:4px;">${escapeHtml(customerName)}</div>
             ${email ? `<div style="font-size:${typography.fontSizeSm};color:${colors.textMuted};">${escapeHtml(email)}</div>` : ""}`
          : ""
      }
    </td>
  </tr>
</table>
${renderCustomerDetailsTable({ customerName, email, billingAddress })}
${renderProductList({ items })}
${renderPricingTotals({ subtotal, shipping, tax, discount, grandTotal })}
${
  notes
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;"><tr><td style="font-family:${typography.fontFamily};font-size:${typography.fontSizeSm};color:${colors.textMuted};line-height:1.6;"><strong>Notes:</strong> ${escapeHtml(notes)}</td></tr></table>`
    : ""
}`.trim();
};
