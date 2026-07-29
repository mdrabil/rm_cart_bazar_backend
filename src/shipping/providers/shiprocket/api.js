import { BASE_URL } from "./config.js";
import { httpRequest } from "../../config.js";

let cachedToken = null;
let tokenExpiresAt = 0;

export async function authenticate(credentials) {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60_000) {
    return cachedToken;
  }

  const data = await httpRequest(`${BASE_URL}/v1/external/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email: credentials.keyId,
      password: credentials.secret,
    }),
  });

  if (!data?.token) {
    throw new Error("Shiprocket authentication failed");
  }

  cachedToken = data.token;
  tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

export async function apiCall(credentials, path, options = {}) {
  const token = await authenticate(credentials);
  return httpRequest(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

export async function fetchPickupLocations(credentials) {
  return apiCall(credentials, "/v1/external/settings/company/pickup", { method: "GET" });
}

export async function createAdhocOrder(credentials, payload) {
  return apiCall(credentials, "/v1/external/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function trackByAwb(credentials, awb) {
  return apiCall(credentials, `/v1/external/courier/track/awb/${encodeURIComponent(awb)}`, {
    method: "GET",
  });
}

export async function cancelOrder(credentials, orderIds) {
  return apiCall(credentials, "/v1/external/orders/cancel", {
    method: "POST",
    body: JSON.stringify({ ids: orderIds }),
  });
}

export async function generateLabel(credentials, shipmentIds) {
  return apiCall(credentials, "/v1/external/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentIds }),
  });
}

export async function generateManifest(credentials, shipmentIds) {
  return apiCall(credentials, "/v1/external/manifests/generate", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentIds }),
  });
}
