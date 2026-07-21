import { BRAND } from "../../brand.js";
import { buildAccountEmail } from "../shared/accountEmail.js";
import { renderInfoCard, renderKeyValueRow } from "../../components/index.js";
import { escapeHtml } from "../../helpers/escape.js";

export const loginCredentialsEmail = (data = {}) => {
  const {
    customerName = "",
    username = "",
    email = "",
    temporaryPassword = "",
    loginUrl,
    website = BRAND.website,
  } = data;

  const rows = [
    username && renderKeyValueRow({ label: "Username", value: escapeHtml(username) }),
    email && renderKeyValueRow({ label: "Email", value: escapeHtml(email) }),
    temporaryPassword &&
      renderKeyValueRow({
        label: "Temporary Password",
        value: `<code style="font-family:monospace;background:#F5F7FA;padding:4px 8px;border-radius:4px;">${escapeHtml(temporaryPassword)}</code>`,
      }),
  ]
    .filter(Boolean)
    .join("");

  return buildAccountEmail({
    subject: `${BRAND.companyName} — Your Login Credentials`,
    preheader: "Your account credentials are inside. Please change your password after first login.",
    eyebrow: "Account Access",
    title: "Your Login Credentials",
    subtitle: "Use the details below to access your MR Crafted account.",
    greetingName: customerName,
    bodyHtml: renderInfoCard({
      title: "Login Details",
      content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`,
      footer: temporaryPassword
        ? "Please change your temporary password immediately after your first login."
        : "",
    }),
    ctaLabel: "Log In Now",
    ctaUrl: loginUrl,
    website,
    alert: {
      type: "warning",
      title: "Keep your credentials safe",
      message: "Never share your password with anyone. MR Crafted staff will never ask for your password.",
    },
  });
};

export default loginCredentialsEmail;
