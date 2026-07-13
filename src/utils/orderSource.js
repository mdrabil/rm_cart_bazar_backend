import { ORDER_SOURCE } from "../constants/enums.js";

/** Normalize client platform / orderSource to website | app */
export function normalizeOrderSource(orderSource, platform) {
  const raw = String(orderSource || platform || ORDER_SOURCE.WEBSITE)
    .toLowerCase()
    .trim();

  if (["app", "android", "ios", "mobile"].includes(raw)) {
    return ORDER_SOURCE.APP;
  }

  return ORDER_SOURCE.WEBSITE;
}
