/**
 * Escape user input for safe use inside MongoDB $regex patterns.
 */
export function escapeRegex(value) {
  if (value == null || typeof value !== "string") return "";
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
