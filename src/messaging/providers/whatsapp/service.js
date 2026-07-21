/**
 * WhatsApp provider — MessageCentral with flowType=WHATSAPP.
 * Uses the same ENV credentials as MessageCentral when configured separately,
 * or can share MessageCentral ENV names in the admin panel.
 */

import createMessageCentralProvider from "../messagecentral/service.js";

export default function createWhatsAppProvider(credentials, providerDoc) {
  const base = createMessageCentralProvider(credentials, providerDoc);

  return {
    ...base,
    name: providerDoc.providerName,
    channels: providerDoc.supportedChannels || ["whatsapp"],

    async sendOtp(payload) {
      return base.sendOtp({ ...payload, channel: "whatsapp" });
    },
  };
}
