import { getIO } from "./socket.js";

/**
 * Broadcast catalog / CMS mutations to storefront + admin rooms.
 * Frontend invalidates React Query / refreshes RSC; admin can refetch lists.
 *
 * @param {{
 *   entity: string,
 *   action?: "create"|"update"|"delete"|"status"|"sync",
 *   id?: string|null,
 *   slug?: string|null,
 *   meta?: Record<string, unknown>,
 * }} payload
 */
export function emitDataChange(payload = {}) {
  try {
    const io = getIO();
    const message = {
      entity: String(payload.entity || "unknown").toLowerCase(),
      action: payload.action || "update",
      id: payload.id ? String(payload.id) : null,
      slug: payload.slug ? String(payload.slug) : null,
      meta: payload.meta || {},
      at: new Date().toISOString(),
    };

    io.to("storefront").emit("data:change", message);
    io.to("admin").emit("data:change", message);
  } catch (err) {
    console.error("emitDataChange:", err.message);
  }
}

/** Map HTTP method → action label */
export function httpMethodToAction(method = "") {
  switch (String(method).toUpperCase()) {
    case "POST":
      return "create";
    case "DELETE":
      return "delete";
    case "PATCH":
      return "status";
    case "PUT":
    default:
      return "update";
  }
}
