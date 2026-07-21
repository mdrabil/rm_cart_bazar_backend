import { BRAND, getBrandUrls } from "../../brand.js";
import { buildAccountEmail } from "../shared/accountEmail.js";
import { renderInfoCard } from "../../components/index.js";
import { escapeHtml } from "../../helpers/escape.js";

export const welcomeEmail = (data = {}) => {
  const { customerName = "", website = BRAND.website } = data;
  const urls = getBrandUrls({ website });

  return buildAccountEmail({
    subject: `Welcome to ${BRAND.companyName}! 🎉`,
    preheader: "Start customizing products with text, images, and designs.",
    eyebrow: "Welcome",
    title: "Welcome to MR Crafted",
    subtitle:
      "Your journey into custom printing and personalized products starts here.",
    greetingName: customerName,
    introHtml: `<p style="margin:0 0 16px;line-height:1.7;">We're thrilled to have you! Browse our collection, add your personal touch with custom text and designs, and we'll handle the printing, packing, and delivery.</p>`,
    bodyHtml: renderInfoCard({
      title: "What you can do",
      content: `
        <ul style="margin:0;padding-left:18px;line-height:1.8;">
          <li>Customize products with text, images &amp; designs</li>
          <li>Track your orders in real time</li>
          <li>Save designs for faster reordering</li>
          <li>Get expert design review before printing</li>
        </ul>`,
    }),
    ctaLabel: "Start Shopping",
    ctaUrl: urls.website,
    website,
    alert: {
      type: "success",
      title: "Account Ready",
      message: `Your account at ${escapeHtml(urls.website)} is ready to use.`,
    },
  });
};

export default welcomeEmail;
