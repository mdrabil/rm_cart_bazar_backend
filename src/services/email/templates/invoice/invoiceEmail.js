import { BRAND, getBrandUrls } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import { renderHero, renderInvoiceTable, renderPrimaryButton } from "../../components/index.js";

export const invoiceEmail = (data = {}) => {
  const {
    customerName = "",
    email = "",
    orderNumber = "",
    invoiceNumber = data.invoiceNumber || orderNumber,
    website = BRAND.website,
    ...invoiceData
  } = data;

  const urls = getBrandUrls({ website });
  const subject = `Invoice #${invoiceNumber} — ${BRAND.companyName}`;

  const html = renderBaseLayout({
    title: subject,
    preheader: `Your invoice for order #${orderNumber || invoiceNumber}`,
    heroHtml: renderHero({
      eyebrow: "Invoice",
      title: "Your Invoice",
      subtitle: `Invoice #${invoiceNumber}${orderNumber ? ` for Order #${orderNumber}` : ""}`,
    }),
    bodyHtml: [
      customerName
        ? `<p style="margin:0 0 16px;">Hi <strong>${customerName}</strong>, please find your invoice details below.</p>`
        : "",
      renderInvoiceTable({
        invoiceNumber,
        customerName,
        email,
        ...invoiceData,
      }),
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 0;">${renderPrimaryButton({ label: "View Order", href: urls.orders })}</td></tr></table>`,
    ].join(""),
  });

  const text = `Invoice #${invoiceNumber}\nOrder: ${orderNumber}\nTotal: ${data.grandTotal ?? ""}`;

  return buildEmailPayload({ subject, html, text });
};

export default invoiceEmail;
