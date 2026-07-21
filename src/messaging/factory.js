/**
 * MessageProviderFactory — load active provider from DB (no hardcoded selection in controllers).
 *
 *   const { doc, service, channel } = await MessageProviderFactory.getActiveForIdentifierType("email");
 *   const { doc, service, channel } = await MessageProviderFactory.getActiveForIdentifierType("mobile");
 */

import MessageProvider, {
  MESSAGE_PROVIDER_STATUS,
} from "../models/MessageProvider.model.js";
import {
  resolveMessageCredentials,
  assertProviderActive,
} from "./config.js";

import createEmailProvider from "./providers/email/service.js";
import createMessageCentralProvider from "./providers/messagecentral/service.js";
import createWhatsAppProvider from "./providers/whatsapp/service.js";

const BUILDERS = {
  email: createEmailProvider,
  messagecentral: createMessageCentralProvider,
  whatsapp: createWhatsAppProvider,
};

export const PROVIDER_LABELS = Object.freeze({
  email: "Email",
  messagecentral: "MessageCentral",
  whatsapp: "WhatsApp",
});

const MOBILE_CHANNELS = ["sms", "whatsapp"];

export function providerKey(name) {
  return String(name || "").trim().toLowerCase();
}

export function canonicalProviderName(name) {
  const key = providerKey(name);
  return PROVIDER_LABELS[key] || String(name || "").trim();
}

export function isProviderImplemented(name) {
  return Boolean(BUILDERS[providerKey(name)]);
}

export const listSupportedProviderNames = () =>
  Object.keys(BUILDERS).map((key) => PROVIDER_LABELS[key] || key);

/**
 * Pick delivery channel from provider.supportedChannels (DB-driven).
 */
export function resolveChannelFromProvider(providerDoc, identifierType) {
  const channels = providerDoc.supportedChannels || [];

  if (identifierType === "email") {
    if (!channels.includes("email")) {
      throw new Error(
        `${providerDoc.displayName} does not support email`
      );
    }
    return "email";
  }

  // Mobile: prefer SMS if configured, else WhatsApp (admin controls via supportedChannels)
  if (channels.includes("sms")) return "sms";
  if (channels.includes("whatsapp")) return "whatsapp";

  throw new Error(
    `${providerDoc.displayName} has no SMS/WhatsApp channel configured`
  );
}

export function loadProvider(providerDoc) {
  const key = providerKey(providerDoc.providerName);
  const build = BUILDERS[key];
  if (!build) {
    throw new Error(
      `Message provider driver not implemented: ${providerDoc.providerName}`
    );
  }
  const credentials = resolveMessageCredentials(providerDoc);
  const service = build(credentials, providerDoc);
  return { doc: providerDoc, credentials, service };
}

/**
 * Prefer default+active matching channel filter, else highest priority (lowest number).
 */
export async function getActiveProviderDoc(channelFilter) {
  const filter =
    typeof channelFilter === "string"
      ? { supportedChannels: channelFilter }
      : channelFilter || {};

  let doc = await MessageProvider.findOne({
    isDefault: true,
    status: MESSAGE_PROVIDER_STATUS.ACTIVE,
    ...filter,
  }).sort({ priority: 1 });

  if (!doc) {
    doc = await MessageProvider.findOne({
      status: MESSAGE_PROVIDER_STATUS.ACTIVE,
      ...filter,
    }).sort({ priority: 1 });
  }

  if (!doc) {
    throw new Error("No active message provider configured for this request");
  }

  return doc;
}

/**
 * Select provider by identifier type using DB default → priority fallback.
 * Email → email channel providers
 * Mobile → SMS / WhatsApp providers
 */
export async function getActiveProviderDocForType(identifierType) {
  if (identifierType === "email") {
    return getActiveProviderDoc("email");
  }

  if (identifierType === "mobile") {
    return getActiveProviderDoc({
      supportedChannels: { $in: MOBILE_CHANNELS },
    });
  }

  throw new Error('identifierType must be "email" or "mobile"');
}

export async function getProviderDocByName(name) {
  const doc = await MessageProvider.findOne({
    providerName: { $regex: `^${name}$`, $options: "i" },
  });
  if (!doc) throw new Error(`Message provider not found: ${name}`);
  return doc;
}

const MessageProviderFactory = {
  async getActive(channel) {
    const doc = await getActiveProviderDoc(channel);
    assertProviderActive(doc, channel);
    return { ...loadProvider(doc), channel };
  },

  async getActiveForIdentifierType(identifierType) {
    const doc = await getActiveProviderDocForType(identifierType);
    const channel = resolveChannelFromProvider(doc, identifierType);
    assertProviderActive(doc, channel);
    return { ...loadProvider(doc), channel };
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
};

export default MessageProviderFactory;
