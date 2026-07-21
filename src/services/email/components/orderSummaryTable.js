import { BRAND } from "../brand.js";
import { escapeHtml, nl2br } from "../helpers/escape.js";
import { formatCurrency, formatDate } from "../helpers/formatters.js";
import { renderKeyValueRow } from "./infoCard.js";

/**
 * Order summary key-value table.
 */
export const renderOrderSummaryTable = ({
  orderNumber,
  orderDate,
  paymentStatus,
  paymentMethod,
  orderStatus,
  estimatedDeliveryDate,
  courierName,
  trackingNumber,
} = {}) => {
  const { colors, typography, layout } = BRAND;

  const rows = [
    orderNumber && { label: "Order Number", value: escapeHtml(orderNumber), bold: true },
    orderDate && { label: "Order Date", value: formatDate(orderDate, { withTime: true }) },
    paymentStatus && { label: "Payment Status", value: escapeHtml(paymentStatus) },
    paymentMethod && { label: "Payment Method", value: escapeHtml(paymentMethod) },
    orderStatus && { label: "Order Status", value: escapeHtml(orderStatus) },
    estimatedDeliveryDate && {
      label: "Estimated Delivery",
      value: formatDate(estimatedDeliveryDate),
    },
    courierName && { label: "Courier", value: escapeHtml(courierName) },
    trackingNumber && {
      label: "Tracking Number",
      value: `<span style="font-family:monospace;">${escapeHtml(trackingNumber)}</span>`,
    },
  ].filter(Boolean);

  if (!rows.length) return "";

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;background-color:${colors.white};border:1px solid ${colors.border};border-radius:${layout.borderRadius};overflow:hidden;">
  <tr>
    <td style="padding:14px ${layout.padding};background-color:${colors.background};font-family:${typography.fontFamily};font-size:${typography.fontSizeSm};font-weight:700;color:${colors.primary};text-transform:uppercase;letter-spacing:0.5px;">
      Order Summary
    </td>
  </tr>
  <tr>
    <td style="padding:${layout.paddingSm} ${layout.padding};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows.map((row) => renderKeyValueRow(row)).join("")}
      </table>
    </td>
  </tr>
</table>`.trim();
};

/**
 * Customer / address details table.
 */
export const renderCustomerDetailsTable = ({
  customerName,
  email,
  phone,
  shippingAddress,
  billingAddress,
} = {}) => {
  const { colors, typography, layout } = BRAND;

  const renderAddressBlock = (title, address) => {
    if (!address) return "";
    const content =
      typeof address === "string" ? nl2br(address) : formatAddressBlock(address);
    return `
      <tr>
        <td style="padding:12px 0;border-top:1px solid ${colors.border};">
          <div style="font-size:${typography.fontSizeXs};font-weight:700;color:${colors.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${escapeHtml(title)}</div>
          <div style="font-size:${typography.fontSizeSm};color:${colors.text};line-height:1.7;">${content}</div>
        </td>
      </tr>`;
  };

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;background-color:${colors.white};border:1px solid ${colors.border};border-radius:${layout.borderRadius};overflow:hidden;">
  <tr>
    <td style="padding:14px ${layout.padding};background-color:${colors.background};font-family:${typography.fontFamily};font-size:${typography.fontSizeSm};font-weight:700;color:${colors.primary};text-transform:uppercase;letter-spacing:0.5px;">
      Customer Details
    </td>
  </tr>
  <tr>
    <td style="padding:${layout.paddingSm} ${layout.padding};font-family:${typography.fontFamily};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${customerName ? renderKeyValueRow({ label: "Name", value: escapeHtml(customerName) }) : ""}
        ${email ? renderKeyValueRow({ label: "Email", value: escapeHtml(email) }) : ""}
        ${phone ? renderKeyValueRow({ label: "Phone", value: escapeHtml(phone) }) : ""}
        ${renderAddressBlock("Shipping Address", shippingAddress)}
        ${renderAddressBlock("Billing Address", billingAddress)}
      </table>
    </td>
  </tr>
</table>`.trim();
};

const formatAddressBlock = (address) => {
  const lines = [
    address.fullName || address.name,
    address.line1 || address.addressLine || address.fullAddress,
    address.line2,
    [address.city, address.state, address.pincode || address.zip]
      .filter(Boolean)
      .join(", "),
    address.country,
    address.phone || address.mobile,
  ].filter(Boolean);
  return lines.map(escapeHtml).join("<br />");
};
