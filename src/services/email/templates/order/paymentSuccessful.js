import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const paymentSuccessfulEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Payment Successful — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your payment was received successfully.",
    eyebrow: "Payment Confirmed",
    title: "Payment Successful",
    subtitle: `We have received your payment of ₹${data.grandTotal ?? ""} via ${data.paymentMethod || "your selected method"}.`,
    statusLabel: data.paymentStatus || "Paid",
    statusType: "success",
    alert: {
      type: "success",
      title: "Payment Confirmed",
      message: "Your order will now move to design review and production.",
    },
    ctaLabel: "View Order",
  });

export default paymentSuccessfulEmail;
