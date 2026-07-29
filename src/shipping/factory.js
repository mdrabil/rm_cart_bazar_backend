/**
 * Shipping factory — load active provider or provider by name.
 */

import ShippingGateway, { PROVIDER_STATUS } from "../models/ShippingGateway.model.js";
import { resolveCredentials, assertProviderActive } from "./config.js";

import createShiprocket from "./providers/shiprocket/service.js";
import createDelhivery from "./providers/delhivery/service.js";
import createBluedart from "./providers/bluedart/service.js";
import createDtdc from "./providers/dtdc/service.js";
import createXpressbees from "./providers/xpressbees/service.js";
import createEkart from "./providers/ekart/service.js";
import createShadowfax from "./providers/shadowfax/service.js";
import createPickrr from "./providers/pickrr/service.js";
import createFedex from "./providers/fedex/service.js";

const BUILDERS = {
  shiprocket: createShiprocket,
  delhivery: createDelhivery,
  bluedart: createBluedart,
  dtdc: createDtdc,
  xpressbees: createXpressbees,
  ekart: createEkart,
  shadowfax: createShadowfax,
  pickrr: createPickrr,
  fedex: createFedex,
};

export const PROVIDER_LABELS = Object.freeze({
  shiprocket: "Shiprocket",
  delhivery: "Delhivery",
  bluedart: "BlueDart",
  dtdc: "DTDC",
  xpressbees: "XpressBees",
  ekart: "Ekart",
  shadowfax: "Shadowfax",
  pickrr: "Pickrr",
  fedex: "FedEx",
});

export function canonicalProviderName(name) {
  const key = String(name || "").trim().toLowerCase();
  return PROVIDER_LABELS[key] || String(name || "").trim();
}

export function providerKey(name) {
  return String(name || "").trim().toLowerCase();
}

export function loadProvider(gatewayDoc) {
  const key = gatewayDoc.providerName?.toLowerCase();
  const build = BUILDERS[key];
  if (!build) {
    throw new Error(`Shipping provider driver not implemented: ${gatewayDoc.providerName}`);
  }
  const credentials = resolveCredentials(gatewayDoc);
  const service = build(credentials, gatewayDoc);
  return { doc: gatewayDoc, credentials, service };
}

export async function getActiveProviderDoc() {
  let doc = await ShippingGateway.findOne({
    isDefault: true,
    status: PROVIDER_STATUS.ACTIVE,
  }).sort({ priority: 1 });

  if (!doc) {
    doc = await ShippingGateway.findOne({
      status: PROVIDER_STATUS.ACTIVE,
    }).sort({ priority: 1 });
  }

  if (!doc) throw new Error("No active shipping provider configured");
  return doc;
}

export async function getProviderDocByName(name) {
  const doc = await ShippingGateway.findOne({
    providerName: { $regex: `^${name}$`, $options: "i" },
  });
  if (!doc) throw new Error(`Shipping provider not found: ${name}`);
  return doc;
}

export function isProviderImplemented(name) {
  return Boolean(BUILDERS[providerKey(name)]);
}

export const listSupportedProviderNames = () =>
  Object.keys(BUILDERS).map((key) => PROVIDER_LABELS[key] || key);

const ShippingFactory = {
  async getActive() {
    const doc = await getActiveProviderDoc();
    assertProviderActive(doc);
    return loadProvider(doc);
  },

  async get(name) {
    const doc = await getProviderDocByName(name);
    assertProviderActive(doc);
    return loadProvider(doc);
  },

  async getDoc(name) {
    return getProviderDocByName(name);
  },

  load: loadProvider,
  listImplemented: () => Object.keys(BUILDERS),
  getCapabilities(name) {
    const key = providerKey(name);
    const build = BUILDERS[key];
    if (!build) return null;
    try {
      const service = build({}, { providerName: canonicalProviderName(name) });
      return service.capabilities || {};
    } catch {
      return {};
    }
  },
};

export default ShippingFactory;
