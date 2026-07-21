/**
 * Example Nodemailer usage — MR Crafted Email Template System
 *
 * Run (from backend root):
 *   node src/services/email/examples/nodemailer-usage.example.js
 *
 * Requires EMAIL_USER and EMAIL_PASS in .env
 */

import dotenv from "dotenv";
dotenv.config();

import {
  EMAIL_TYPE,
  renderEmailTemplate,
  sendTemplateEmail,
  sendTemplateEmailAsync,
  SAMPLE_ORDER,
} from "../index.js";

const DEMO_TO = process.env.DEMO_EMAIL_TO || process.env.EMAIL_USER;

// ─── 1. Render only (preview HTML without sending) ───────────────────────────
const otpPreview = renderEmailTemplate(EMAIL_TYPE.EMAIL_VERIFICATION_OTP, {
  customerName: "Rahul Sharma",
  otp: "482916",
  otpExpiryMinutes: 10,
  verifyUrl: "https://mrcrafted.in/verify?token=abc123",
});

console.log("OTP Email Subject:", otpPreview.subject);
console.log("OTP HTML length:", otpPreview.html.length, "chars");

// ─── 2. Send synchronously (await result) ────────────────────────────────────
async function sendWelcomeExample() {
  await sendTemplateEmail({
    type: EMAIL_TYPE.WELCOME,
    to: DEMO_TO,
    data: {
      customerName: "Rahul Sharma",
    },
  });
  console.log("Welcome email sent to", DEMO_TO);
}

// ─── 3. Send order placed email with full order data ─────────────────────────
async function sendOrderPlacedExample() {
  await sendTemplateEmail({
    type: EMAIL_TYPE.ORDER_PLACED,
    to: DEMO_TO,
    data: {
      ...SAMPLE_ORDER,
      email: DEMO_TO,
    },
  });
  console.log("Order placed email sent");
}

// ─── 4. Fire-and-forget (non-blocking) ───────────────────────────────────────
function sendOtpAsyncExample() {
  sendTemplateEmailAsync({
    type: EMAIL_TYPE.EMAIL_VERIFICATION_OTP,
    to: DEMO_TO,
    data: {
      customerName: "Rahul Sharma",
      otp: "739201",
      otpExpiryMinutes: 10,
    },
  });
  console.log("OTP email queued (async)");
}

// ─── 5. Admin low stock alert ─────────────────────────────────────────────────
async function sendLowStockExample() {
  await sendTemplateEmail({
    type: EMAIL_TYPE.LOW_STOCK_ALERT,
    to: process.env.ADMIN_EMAIL || DEMO_TO,
    data: {
      productName: "Custom Printed T-Shirt — White / L",
      productSku: "TSH-WHT-L",
      currentStock: 3,
      threshold: 10,
    },
  });
  console.log("Low stock alert sent");
}

// ─── 6. Enquiry flow (admin + customer) ──────────────────────────────────────
async function sendEnquiryExamples() {
  const enquiry = {
    customerName: "Priya Patel",
    email: "priya@example.com",
    phone: "+91 98765 43210",
    subject: "Bulk Corporate Order",
    message: "We need 200 customized t-shirts for our company event.",
    enquiryId: "ENQ-2026-0042",
  };

  await sendTemplateEmail({
    type: EMAIL_TYPE.ENQUIRY_RECEIVED_ADMIN,
    to: process.env.ADMIN_EMAIL || DEMO_TO,
    data: enquiry,
  });

  await sendTemplateEmail({
    type: EMAIL_TYPE.ENQUIRY_CONFIRMATION_CUSTOMER,
    to: enquiry.email,
    data: enquiry,
  });

  console.log("Enquiry emails sent");
}

// ─── 7. Password reset ────────────────────────────────────────────────────────
async function sendPasswordResetExample() {
  await sendTemplateEmail({
    type: EMAIL_TYPE.PASSWORD_RESET,
    to: DEMO_TO,
    data: {
      customerName: "Rahul Sharma",
      resetUrl: "https://mrcrafted.in/reset-password?token=xyz789",
      expiryMinutes: 30,
    },
  });
  console.log("Password reset email sent");
}

// ─── Run examples (uncomment the ones you want to test) ──────────────────────
async function main() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Set EMAIL_USER and EMAIL_PASS in .env to send live emails.");
    console.log("Rendered OTP preview subject:", otpPreview.subject);
    return;
  }

  // await sendWelcomeExample();
  // await sendOrderPlacedExample();
  // sendOtpAsyncExample();
  // await sendLowStockExample();
  // await sendEnquiryExamples();
  // await sendPasswordResetExample();

  console.log("\nUncomment example functions in main() to send test emails.");
  console.log("Available types:", Object.keys(EMAIL_TYPE).length);
}

main().catch(console.error);
