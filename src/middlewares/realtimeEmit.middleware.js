import { emitDataChange, httpMethodToAction } from "../sockets/dataEvents.js";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function pickId(req, payload) {
  return (
    payload?.product?._id ||
    payload?.category?._id ||
    payload?.banner?._id ||
    payload?.coupon?._id ||
    payload?.blog?._id ||
    payload?.testimonial?._id ||
    payload?.faq?._id ||
    payload?.page?._id ||
    payload?.data?._id ||
    payload?.permission?._id ||
    payload?._id ||
    req.params?.productId ||
    req.params?.categoryId ||
    req.params?.id ||
    req.params?.section ||
    null
  );
}

function pickSlug(payload) {
  return (
    payload?.product?.slug ||
    payload?.category?.slug ||
    payload?.blog?.slug ||
    payload?.page?.slug ||
    payload?.data?.slug ||
    payload?.slug ||
    null
  );
}

/**
 * Attach after auth on mutating admin/public-write routes.
 * On successful JSON responses, emits Socket.IO `data:change`.
 *
 * Usage: router.use(withRealtimeEmit("product"));
 */
export function withRealtimeEmit(entity) {
  return (req, res, next) => {
    if (!MUTATING.has(String(req.method || "").toUpperCase())) {
      return next();
    }

    const originalJson = res.json.bind(res);

    res.json = (payload) => {
      try {
        const status = res.statusCode || 200;
        const ok =
          status < 400 &&
          payload &&
          typeof payload === "object" &&
          payload.success !== false;

        if (ok) {
          emitDataChange({
            entity,
            action: httpMethodToAction(req.method),
            id: pickId(req, payload),
            slug: pickSlug(payload),
            meta: {
              path: req.originalUrl || req.url,
              method: req.method,
            },
          });
        }
      } catch (err) {
        console.error("withRealtimeEmit:", err.message);
      }

      return originalJson(payload);
    };

    return next();
  };
}
