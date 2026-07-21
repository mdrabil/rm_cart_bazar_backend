import { BRAND } from "../../brand.js";
import { buildAccountEmail } from "../shared/accountEmail.js";
import { renderInfoCard, renderKeyValueRow } from "../../components/index.js";
import { escapeHtml } from "../../helpers/escape.js";

export const accountCreatedEmail = (data = {}) => {
  const {
    customerName = "",
    email = "",
    username = "",
    website = BRAND.website,
  } = data;

  const accountRows = [
    username && renderKeyValueRow({ label: "Username", value: escapeHtml(username) }),
    email && renderKeyValueRow({ label: "Email", value: escapeHtml(email) }),
  ]
    .filter(Boolean)
    .join("");

  return buildAccountEmail({
    subject: `Your ${BRAND.companyName} Account Has Been Created`,
    preheader: "Your account is ready. Log in to start customizing products.",
    eyebrow: "Account Created",
    title: "Account Successfully Created",
    subtitle: "You can now log in and start creating personalized products.",
    greetingName: customerName,
    bodyHtml: renderInfoCard({
      title: "Account Details",
      content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${accountRows}</table>`,
    }),
    ctaLabel: "Log In to Your Account",
    website,
    alert: {
      type: "success",
      title: "You're all set!",
      message: "Explore our catalog and bring your creative ideas to life.",
    },
  });
};

export default accountCreatedEmail;
