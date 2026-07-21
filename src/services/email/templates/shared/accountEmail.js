import { BRAND, getBrandUrls } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { escapeHtml } from "../../helpers/escape.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import {
  renderHero,
  renderOtpBox,
  renderPrimaryButton,
  renderAlertBox,
  renderDivider,
} from "../../components/index.js";

/**
 * Shared builder for account-related emails (OTP, welcome, credentials).
 */
export const buildAccountEmail = ({
  subject,
  preheader = "",
  title,
  subtitle = "",
  eyebrow = "",
  greetingName = "",
  introHtml = "",
  bodyHtml = "",
  otp,
  otpExpiryMinutes = 10,
  ctaLabel = "",
  ctaUrl = "",
  alert = null,
  website = BRAND.website,
} = {}) => {
  const urls = getBrandUrls({ website });

  const heroHtml = renderHero({ eyebrow, title, subtitle });

  const greeting = greetingName
    ? `<p style="margin:0 0 16px;">Hi <strong>${escapeHtml(greetingName)}</strong>,</p>`
    : "";

  const otpHtml = otp
    ? renderOtpBox({ otp, expiryMinutes: otpExpiryMinutes })
    : "";

  const alertHtml = alert
    ? renderAlertBox({
        type: alert.type || "info",
        title: alert.title,
        message: alert.message,
      })
    : "";

  const ctaHtml =
    ctaLabel && (ctaUrl || urls.login)
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 0;">${renderPrimaryButton({ label: ctaLabel, href: ctaUrl || urls.login })}</td></tr></table>`
      : "";

  const content = [greeting, introHtml, otpHtml, alertHtml, bodyHtml, ctaHtml]
    .filter(Boolean)
    .join(renderDivider());

  const html = renderBaseLayout({
    title: subject,
    preheader: preheader || subtitle,
    heroHtml,
    bodyHtml: content,
  });

  const text = [subject, greetingName ? `Hi ${greetingName},` : "", subtitle, otp ? `OTP: ${otp}` : "", ctaUrl || urls.login].filter(Boolean).join("\n\n");

  return buildEmailPayload({ subject, html, text });
};
