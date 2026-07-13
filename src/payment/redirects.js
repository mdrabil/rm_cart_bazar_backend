/**
 * Central payment redirect configuration (backend).
 * Page paths / URLs are read from env — never hardcode success/fail page names here.
 */

import { config as appConfig } from "../config/config.js";

const trimSlash = (value = "") => String(value).replace(/\/+$/, "");

const joinWebsitePath = (path) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${trimSlash(appConfig.websiteUrl)}${normalized}`;
};

const readPath = (fullUrlEnv, pathEnv, defaultPath) => {
  const full = String(process.env[fullUrlEnv] || "").trim();
  if (full) return trimSlash(full);
  const path = String(process.env[pathEnv] || defaultPath).trim();
  return joinWebsitePath(path);
};

/** Website UX redirect targets (stored on checkout session as returnUrl / cancelUrl defaults). */
export const WEBSITE_PAYMENT_REDIRECTS = Object.freeze({
  /** Intermediate page — polls backend until payment is verified. */
  return: readPath(
    "WEBSITE_PAYMENT_RETURN_URL",
    "WEBSITE_PAYMENT_RETURN_PATH",
    "/payment-return"
  ),
  /** Final failed / cancelled / timeout page. */
  failed: readPath(
    "WEBSITE_PAYMENT_FAILED_URL",
    "WEBSITE_PAYMENT_FAILED_PATH",
    "/payment-failed"
  ),
  /** Final success page (frontend navigates here after session poll succeeds). */
  success: readPath(
    "WEBSITE_PAYMENT_SUCCESS_URL",
    "WEBSITE_PAYMENT_SUCCESS_PATH",
    "/mail-success"
  ),
  /** Pending uses the same handler as return (poll until resolved). */
  get pending() {
    return this.return;
  },
  /** Cancel routes to failed page with status=cancelled. */
  get cancel() {
    return this.failed;
  },
});

export function resolveSessionReturnUrl({ platform, returnUrl }) {
  if (returnUrl) return trimSlash(returnUrl);
  if (platform === "website") return WEBSITE_PAYMENT_REDIRECTS.return;
  return returnUrl;
}

export function resolveSessionCancelUrl({ platform, cancelUrl }) {
  if (cancelUrl) return trimSlash(cancelUrl);
  if (platform === "website") return WEBSITE_PAYMENT_REDIRECTS.failed;
  return cancelUrl;
}
