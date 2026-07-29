/**
 * Pickup & delivery address resolution for shipments.
 * Priority: Store → Manual → optional saved location → optional provider API.
 * Delivery always prefers Order data. Coordinates are optional.
 */

import Store from "../models/Store.model.js";
import { PICKUP_SOURCE } from "../models/Shipment.model.js";

const REQUIRED_PICKUP = ["name", "address", "city", "pincode"];
const REQUIRED_DELIVERY = ["city", "pincode"];
const REQUIRED_RECEIVER = ["name", "phone"];

function coordsFromGeo(location) {
  const coords = location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return { latitude: undefined, longitude: undefined, location: undefined };
  }
  const longitude = Number(coords[0]);
  const latitude = Number(coords[1]);
  if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
    return { latitude: undefined, longitude: undefined, location: undefined };
  }
  return {
    latitude,
    longitude,
    location: { type: "Point", coordinates: [longitude, latitude] },
  };
}

function missingFields(obj, keys) {
  return keys.filter((key) => {
    const val = obj?.[key];
    return val == null || String(val).trim() === "";
  });
}

function mergePrefer(base = {}, override = {}) {
  const out = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    out[key] = value;
  }
  return out;
}

/**
 * Build pickup snapshot from Store document.
 */
export function pickupFromStore(store) {
  if (!store) return null;
  const addr = store.address || {};
  const geo = coordsFromGeo(addr.location);

  return {
    source: PICKUP_SOURCE.STORE,
    storeId: store._id,
    mrStoreId: store.mrStoreId || "",
    locationId: "",
    providerPickupId: "",
    name: store.storeName || "",
    phone: store.supportNumber || "",
    email: "",
    fullAddress: addr.fullAddress || "",
    addressLine: addr.fullAddress || "",
    addressLine2: "",
    landmark: "",
    city: addr.city || "",
    state: addr.state || "",
    pincode: addr.pincode || "",
    country: "India",
    latitude: geo.latitude,
    longitude: geo.longitude,
    location: geo.location,
    // convenience alias used by some provider adapters
    address: addr.fullAddress || "",
  };
}

/**
 * Normalize admin/manual pickup payload into snapshot shape.
 */
export function normalizePickupPayload(input = {}, source = PICKUP_SOURCE.MANUAL) {
  const geo =
    input.latitude != null && input.longitude != null
      ? {
          latitude: Number(input.latitude),
          longitude: Number(input.longitude),
          location: {
            type: "Point",
            coordinates: [Number(input.longitude), Number(input.latitude)],
          },
        }
      : coordsFromGeo(input.location);

  const address =
    input.address ||
    input.fullAddress ||
    input.addressLine ||
    "";

  return {
    source: input.source || source,
    storeId: input.storeId || undefined,
    mrStoreId: input.mrStoreId || "",
    locationId: input.locationId || "",
    providerPickupId: input.providerPickupId || "",
    name: input.name || "",
    phone: input.phone || "",
    email: input.email || "",
    fullAddress: input.fullAddress || address,
    addressLine: input.addressLine || address,
    addressLine2: input.addressLine2 || "",
    landmark: input.landmark || "",
    city: input.city || "",
    state: input.state || "",
    pincode: input.pincode || "",
    country: input.country || "India",
    latitude: geo.latitude,
    longitude: geo.longitude,
    location: geo.location,
    address,
  };
}

export function deliveryFromOrder(order) {
  const addr = order?.deliveryAddress || {};
  const geo = coordsFromGeo(addr.location);

  return {
    fullAddress: addr.fullAddress || "",
    addressLine: addr.addressLine || addr.fullAddress || "",
    addressLine2: addr.addressLine2 || "",
    landmark: addr.landmark || "",
    city: addr.city || "",
    state: addr.state || "",
    pincode: addr.pincode || "",
    country: addr.country || "India",
    latitude: geo.latitude ?? addr.latitude,
    longitude: geo.longitude ?? addr.longitude,
    location: geo.location,
  };
}

export function receiverFromOrder(order) {
  return {
    name: order?.customerId?.fullName || "",
    phone: order?.customerId?.mobile || "",
    email: order?.customerId?.email || "",
  };
}

/**
 * Resolve pickup for prefill / create.
 * Priority 1: Order.store → Store address
 * Priority 2: Manual (empty shell; admin fills)
 * Priority 3/4: optional overlays from payload (saved location / provider id)
 */
export async function resolvePickup(order, payloadPickup = {}) {
  let store = null;
  const storeRef = order?.store;

  if (storeRef) {
    try {
      store = await Store.findById(storeRef).select(
        "storeName mrStoreId supportNumber address"
      );
    } catch {
      store = null;
    }
  }

  const fromStore = pickupFromStore(store);
  const hasStorePickup = Boolean(fromStore);

  // Start with store snapshot when available; otherwise empty manual shell
  let pickup = hasStorePickup
    ? fromStore
    : normalizePickupPayload({}, PICKUP_SOURCE.MANUAL);

  // Optional overlays (saved location / provider mapping / admin edits)
  // Never wipe a good store snapshot unless admin explicitly sent overrides
  const overlay = normalizePickupPayload(
    payloadPickup,
    payloadPickup?.source ||
      (payloadPickup?.providerPickupId
        ? PICKUP_SOURCE.PROVIDER
        : payloadPickup?.locationId
          ? PICKUP_SOURCE.SAVED_LOCATION
          : hasStorePickup
            ? PICKUP_SOURCE.STORE
            : PICKUP_SOURCE.MANUAL)
  );

  if (payloadPickup && Object.keys(payloadPickup).length) {
    pickup = mergePrefer(pickup, {
      ...overlay,
      // Keep store ids if we started from store and overlay didn't change source intentionally
      storeId: overlay.storeId || pickup.storeId,
      mrStoreId: overlay.mrStoreId || pickup.mrStoreId,
      source:
        overlay.source ||
        (hasStorePickup ? PICKUP_SOURCE.STORE : PICKUP_SOURCE.MANUAL),
    });
  }

  // Provider adapters expect `.address`
  pickup.address = pickup.address || pickup.fullAddress || pickup.addressLine || "";

  const missing = missingFields(
    {
      name: pickup.name,
      address: pickup.address || pickup.fullAddress,
      city: pickup.city,
      pincode: pickup.pincode,
    },
    REQUIRED_PICKUP
  );

  return {
    pickup,
    store: store
      ? {
          _id: store._id,
          mrStoreId: store.mrStoreId,
          storeName: store.storeName,
          supportNumber: store.supportNumber,
        }
      : null,
    pickupSource: pickup.source,
    storeAvailable: hasStorePickup,
    requiresManualPickup: !hasStorePickup || missing.length > 0,
    pickupMissingFields: missing,
    pickupComplete: missing.length === 0,
  };
}

export async function resolveDelivery(order, payload = {}) {
  const fromOrder = deliveryFromOrder(order);
  const receiverBase = receiverFromOrder(order);

  const deliveryAddress = mergePrefer(fromOrder, payload.deliveryAddress || {});
  const receiver = mergePrefer(receiverBase, payload.receiver || {});

  // Re-apply coords if admin provided lat/lng
  if (deliveryAddress.latitude != null && deliveryAddress.longitude != null) {
    deliveryAddress.location = {
      type: "Point",
      coordinates: [
        Number(deliveryAddress.longitude),
        Number(deliveryAddress.latitude),
      ],
    };
  } else if (!deliveryAddress.location) {
    const geo = coordsFromGeo(order?.deliveryAddress?.location);
    deliveryAddress.latitude = geo.latitude;
    deliveryAddress.longitude = geo.longitude;
    deliveryAddress.location = geo.location;
  }

  const deliveryMissing = missingFields(deliveryAddress, REQUIRED_DELIVERY);
  const receiverMissing = missingFields(receiver, REQUIRED_RECEIVER);

  return {
    deliveryAddress,
    receiver,
    deliveryMissingFields: deliveryMissing,
    receiverMissingFields: receiverMissing,
    deliveryComplete: deliveryMissing.length === 0,
    receiverComplete: receiverMissing.length === 0,
    requiresManualDelivery: deliveryMissing.length > 0 || receiverMissing.length > 0,
  };
}
