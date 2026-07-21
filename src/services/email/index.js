/**
 * MR Crafted — Production Email Template System
 *
 * Modular, table-based, inline-CSS email templates for Node.js + Nodemailer.
 */

// Brand & types
export { BRAND, getBrandUrls } from "./brand.js";
export { EMAIL_TYPE } from "./types.js";

// Service
export {
  renderEmailTemplate,
  sendTemplateEmail,
  sendTemplateEmailAsync,
} from "./email.service.js";

// Layout & components (for custom templates)
export { renderBaseLayout } from "./layout/index.js";
export * from "./components/index.js";

// Helpers
export * from "./helpers/index.js";

// All template builders
export {
  emailTemplates,
  emailVerificationOtpEmail,
  welcomeEmail,
  accountCreatedEmail,
  passwordResetEmail,
  loginCredentialsEmail,
  passwordChangedEmail,
  orderPlacedEmail,
  paymentSuccessfulEmail,
  paymentFailedEmail,
  orderConfirmedEmail,
  designStartedEmail,
  designApprovalRequiredEmail,
  designApprovedEmail,
  printingStartedEmail,
  printingCompletedEmail,
  qualityCheckEmail,
  packedEmail,
  shippedEmail,
  outForDeliveryEmail,
  deliveredEmail,
  cancelledEmail,
  refundInitiatedEmail,
  refundCompletedEmail,
  orderReturnedEmail,
  enquiryReceivedAdminEmail,
  enquiryConfirmationCustomerEmail,
  invoiceEmail,
  newsletterEmail,
  promotionalOfferEmail,
  reviewRequestEmail,
  contactFormSubmissionEmail,
  adminNotificationEmail,
  lowStockAlertEmail,
} from "./templates/index.js";

// Shared builders
export { buildOrderStatusEmail } from "./templates/shared/orderStatusEmail.js";
export { buildAccountEmail } from "./templates/shared/accountEmail.js";

export { default } from "./email.service.js";
