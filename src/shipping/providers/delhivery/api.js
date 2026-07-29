import { BASE_URL } from "./config.js";
import { httpRequest } from "../../config.js";

function getBaseUrl(credentials) {
  return credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;
}

export async function apiCall(credentials, path, options = {}) {
  const base = getBaseUrl(credentials);
  return httpRequest(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Token ${credentials.keyId}`,
      ...(options.headers || {}),
    },
  });
}

export async function createShipment(credentials, payload) {
  const client = credentials.merchantId || credentials.secret;
  const query = new URLSearchParams({
    format: "json",
    data: JSON.stringify(payload),
  });

  return apiCall(credentials, `/api/cmu/create.json?${query.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export async function trackByWaybill(credentials, waybill) {
  return apiCall(credentials, `/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`, {
    method: "GET",
  });
}

export async function cancelShipment(credentials, waybill) {
  return apiCall(credentials, `/api/p/edit`, {
    method: "POST",
    body: JSON.stringify({
      waybill,
      cancellation: "true",
    }),
  });
}

export function buildShipmentPayload(payload, clientName) {
  const addr = payload.deliveryAddress || {};
  const receiver = payload.receiver || {};

  return {
    shipments: [
      {
        name: receiver.name,
        add: addr.addressLine || addr.fullAddress,
        pin: addr.pincode,
        city: addr.city,
        state: addr.state || "",
        country: addr.country || "India",
        phone: receiver.phone,
        order: payload.orderReference,
        payment_mode: payload.codAmount > 0 ? "COD" : "Prepaid",
        return_pin: "",
        return_city: "",
        return_phone: "",
        return_add: "",
        return_state: "",
        return_country: "India",
        products_desc: (payload.items || []).map((i) => i.productName).join(", ") || "Products",
        hsn_code: "",
        cod_amount: payload.codAmount || 0,
        order_date: new Date().toISOString().slice(0, 10),
        total_amount: payload.subTotal || payload.codAmount || 0,
        seller_add: payload.pickupLocation?.address || "",
        seller_name: payload.pickupLocation?.name || clientName,
        seller_inv: payload.orderReference,
        quantity: payload.packageCount || 1,
        waybill: "",
        shipment_width: payload.dimensions?.width || 10,
        shipment_height: payload.dimensions?.height || 10,
        weight: payload.weight || 0.5,
      },
    ],
    pickup_location: {
      name: payload.pickupLocation?.name || clientName,
      add: payload.pickupLocation?.address || "",
      city: payload.pickupLocation?.city || "",
      pin_code: payload.pickupLocation?.pincode || "",
      country: "India",
      phone: payload.pickupLocation?.phone || "",
    },
  };
}
