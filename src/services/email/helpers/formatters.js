import { escapeHtml } from "./escape.js";

const DEFAULT_LOCALE = "en-IN";
const DEFAULT_CURRENCY = "INR";

export const formatCurrency = (
  amount,
  { locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY } = {}
) => {
  const num = Number(amount);
  if (!Number.isFinite(num)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `₹${num.toFixed(2)}`;
  }
};

export const formatDate = (
  date,
  { locale = DEFAULT_LOCALE, withTime = false } = {}
) => {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return escapeHtml(String(date));
  const options = withTime
    ? {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    : { day: "2-digit", month: "short", year: "numeric" };
  return new Intl.DateTimeFormat(locale, options).format(d);
};

export const formatAddress = (address) => {
  if (!address) return "—";
  if (typeof address === "string") return escapeHtml(address);
  const parts = [
    address.fullName || address.name,
    address.line1 || address.addressLine || address.fullAddress,
    address.line2,
    [address.city, address.state, address.pincode || address.zip]
      .filter(Boolean)
      .join(", "),
    address.country,
    address.phone || address.mobile,
  ].filter(Boolean);
  return parts.map(escapeHtml).join("<br />");
};

export const formatPlainAddress = (address) => {
  if (!address) return "";
  if (typeof address === "string") return address;
  return [
    address.fullName || address.name,
    address.line1 || address.addressLine || address.fullAddress,
    address.line2,
    [address.city, address.state, address.pincode || address.zip]
      .filter(Boolean)
      .join(", "),
    address.country,
    address.phone || address.mobile,
  ]
    .filter(Boolean)
    .join(", ");
};
