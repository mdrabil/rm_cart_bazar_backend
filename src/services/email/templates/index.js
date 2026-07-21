/**
 * Central registry of all email template builders.
 * Each builder accepts a data object and returns { subject, html, text }.
 */
import emailVerificationOtpEmail from "./account/emailVerificationOtp.js";
import welcomeEmail from "./account/welcome.js";
import accountCreatedEmail from "./account/accountCreated.js";
import passwordResetEmail from "./account/passwordReset.js";
import loginCredentialsEmail from "./account/loginCredentials.js";
import passwordChangedEmail from "./account/passwordChanged.js";

import orderPlacedEmail from "./order/orderPlaced.js";
import paymentSuccessfulEmail from "./order/paymentSuccessful.js";
import paymentFailedEmail from "./order/paymentFailed.js";
import orderConfirmedEmail from "./order/orderConfirmed.js";
import designStartedEmail from "./order/designStarted.js";
import designApprovalRequiredEmail from "./order/designApprovalRequired.js";
import designApprovedEmail from "./order/designApproved.js";
import printingStartedEmail from "./order/printingStarted.js";
import printingCompletedEmail from "./order/printingCompleted.js";
import qualityCheckEmail from "./order/qualityCheck.js";
import packedEmail from "./order/packed.js";
import shippedEmail from "./order/shipped.js";
import outForDeliveryEmail from "./order/outForDelivery.js";
import deliveredEmail from "./order/delivered.js";
import cancelledEmail from "./order/cancelled.js";
import refundInitiatedEmail from "./order/refundInitiated.js";
import refundCompletedEmail from "./order/refundCompleted.js";
import orderReturnedEmail from "./order/orderReturned.js";

import enquiryReceivedAdminEmail from "./enquiry/enquiryReceivedAdmin.js";
import enquiryConfirmationCustomerEmail from "./enquiry/enquiryConfirmationCustomer.js";

import invoiceEmail from "./invoice/invoiceEmail.js";

import newsletterEmail from "./marketing/newsletter.js";
import promotionalOfferEmail from "./marketing/promotionalOffer.js";
import reviewRequestEmail from "./marketing/reviewRequest.js";

import contactFormSubmissionEmail from "./admin/contactFormSubmission.js";
import adminNotificationEmail from "./admin/adminNotification.js";
import lowStockAlertEmail from "./admin/lowStockAlert.js";

import { EMAIL_TYPE } from "../types.js";

export const emailTemplates = Object.freeze({
  [EMAIL_TYPE.EMAIL_VERIFICATION_OTP]: emailVerificationOtpEmail,
  [EMAIL_TYPE.WELCOME]: welcomeEmail,
  [EMAIL_TYPE.ACCOUNT_CREATED]: accountCreatedEmail,
  [EMAIL_TYPE.PASSWORD_RESET]: passwordResetEmail,
  [EMAIL_TYPE.LOGIN_CREDENTIALS]: loginCredentialsEmail,
  [EMAIL_TYPE.PASSWORD_CHANGED]: passwordChangedEmail,

  [EMAIL_TYPE.ORDER_PLACED]: orderPlacedEmail,
  [EMAIL_TYPE.PAYMENT_SUCCESSFUL]: paymentSuccessfulEmail,
  [EMAIL_TYPE.PAYMENT_FAILED]: paymentFailedEmail,
  [EMAIL_TYPE.ORDER_CONFIRMED]: orderConfirmedEmail,
  [EMAIL_TYPE.DESIGN_STARTED]: designStartedEmail,
  [EMAIL_TYPE.DESIGN_APPROVAL_REQUIRED]: designApprovalRequiredEmail,
  [EMAIL_TYPE.DESIGN_APPROVED]: designApprovedEmail,
  [EMAIL_TYPE.PRINTING_STARTED]: printingStartedEmail,
  [EMAIL_TYPE.PRINTING_COMPLETED]: printingCompletedEmail,
  [EMAIL_TYPE.QUALITY_CHECK]: qualityCheckEmail,
  [EMAIL_TYPE.PACKED]: packedEmail,
  [EMAIL_TYPE.SHIPPED]: shippedEmail,
  [EMAIL_TYPE.OUT_FOR_DELIVERY]: outForDeliveryEmail,
  [EMAIL_TYPE.DELIVERED]: deliveredEmail,
  [EMAIL_TYPE.CANCELLED]: cancelledEmail,
  [EMAIL_TYPE.REFUND_INITIATED]: refundInitiatedEmail,
  [EMAIL_TYPE.REFUND_COMPLETED]: refundCompletedEmail,
  [EMAIL_TYPE.ORDER_RETURNED]: orderReturnedEmail,

  [EMAIL_TYPE.ENQUIRY_RECEIVED_ADMIN]: enquiryReceivedAdminEmail,
  [EMAIL_TYPE.ENQUIRY_CONFIRMATION_CUSTOMER]: enquiryConfirmationCustomerEmail,

  [EMAIL_TYPE.INVOICE]: invoiceEmail,
  [EMAIL_TYPE.NEWSLETTER]: newsletterEmail,
  [EMAIL_TYPE.PROMOTIONAL_OFFER]: promotionalOfferEmail,
  [EMAIL_TYPE.REVIEW_REQUEST]: reviewRequestEmail,

  [EMAIL_TYPE.CONTACT_FORM_SUBMISSION]: contactFormSubmissionEmail,
  [EMAIL_TYPE.ADMIN_NOTIFICATION]: adminNotificationEmail,
  [EMAIL_TYPE.LOW_STOCK_ALERT]: lowStockAlertEmail,
});

export {
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
};

export default emailTemplates;
