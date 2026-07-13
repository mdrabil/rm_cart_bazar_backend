import { getIO } from "./socket.js";
import { ORDER_STATUS } from "../constants/enums.js";

export function serializeOrderForSocket(order) {
  if (!order) return null;
  const doc = typeof order.toObject === "function" ? order.toObject() : order;
  return {
    _id: String(doc._id),
    mrOrderId: doc.mrOrderId,
    status: doc.status,
    payableAmount: doc.payableAmount,
    paymentMethod: doc.paymentMethod,
    orderSource: doc.orderSource || "website",
    store: doc.store ? String(doc.store) : null,
    customerId: doc.customerId ? String(doc.customerId) : null,
    createdAt: doc.createdAt,
  };
}

export function resolveOrderEventType(order, previousStatus) {
  if (order?.status === ORDER_STATUS.CANCELLED) return "cancelled";
  if (!previousStatus) return "new";
  return "status";
}

/** Push realtime order updates to admin + store rooms. */
export function emitOrderUpdate({ type, order, previousStatus }) {
  try {
    const io = getIO();
    const payload = {
      type: type || resolveOrderEventType(order, previousStatus),
      order: serializeOrderForSocket(order),
      previousStatus: previousStatus || null,
      at: new Date().toISOString(),
    };

    io.to("admin").emit("order:update", payload);

    const storeId = order?.store?._id || order?.store;
    if (storeId) {
      io.to(`store:${storeId}`).emit("order:update", payload);
    }
  } catch (err) {
    console.error("emitOrderUpdate:", err.message);
  }
}
