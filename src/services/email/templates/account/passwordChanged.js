import { BRAND } from "../../brand.js";
import { buildAccountEmail } from "../shared/accountEmail.js";

export const passwordChangedEmail = (data = {}) => {
  const {
    customerName = "",
    changedAt = new Date().toISOString(),
    website = BRAND.website,
  } = data;

  return buildAccountEmail({
    subject: `${BRAND.companyName} — Password Changed Successfully`,
    preheader: "Your account password was updated successfully.",
    eyebrow: "Security Update",
    title: "Password Changed Successfully",
    subtitle: `Your password was updated on ${new Date(changedAt).toLocaleString("en-IN")}.`,
    greetingName: customerName,
    introHtml: `<p style="margin:0;line-height:1.7;">This is a confirmation that the password for your MR Crafted account has been changed successfully.</p>`,
    website,
    alert: {
      type: "error",
      title: "Wasn't you?",
      message:
        "If you did not make this change, please contact our support team immediately at support@mrcrafted.in to secure your account.",
    },
  });
};

export default passwordChangedEmail;
