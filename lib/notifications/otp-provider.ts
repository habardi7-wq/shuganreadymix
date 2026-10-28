export type OtpDeliveryChannel = "WHATSAPP" | "SMS" | "CONSOLE";

export interface OtpProvider {
  send(phone: string, code: string): Promise<OtpDeliveryChannel>;
}

export class ConsoleOtpProvider implements OtpProvider {
  async send(phone: string, code: string): Promise<OtpDeliveryChannel> {
    console.log(`[OTP:DEV] ${phone} -> ${code}`);
    return "CONSOLE";
  }
}

export class UnavailableOtpProvider implements OtpProvider {
  async send(): Promise<OtpDeliveryChannel> {
    throw new Error("OTP delivery provider is not configured");
  }
}

/** Sends an approved authentication template through Meta's WhatsApp Cloud API. */
export class MetaWhatsAppOtpProvider implements OtpProvider {
  constructor(
    private accessToken: string,
    private phoneNumberId: string,
    private templateName: string,
    private templateLanguage: string,
    private graphApiVersion: string
  ) {}

  async send(phone: string, code: string): Promise<OtpDeliveryChannel> {
    const version = this.graphApiVersion.replace(/^\/+|\/+$/g, "");
    const url = `https://graph.facebook.com/${version}/${this.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "template",
        template: {
          name: this.templateName,
          language: { code: this.templateLanguage },
          components: [
            { type: "body", parameters: [{ type: "text", text: code }] },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Meta WhatsApp OTP send failed (${res.status}): ${detail}`);
    }
    return "WHATSAPP";
  }
}

export class TwilioSmsOtpProvider implements OtpProvider {
  constructor(
    private accountSid: string,
    private authToken: string,
    private fromNumber: string
  ) {}

  async send(phone: string, code: string): Promise<OtpDeliveryChannel> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
    const body = new URLSearchParams({
      To: `+${phone}`,
      From: this.fromNumber,
      Body: `رمز التحقق لخرسانة برو: ${code}`,
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Twilio SMS send failed (${res.status}): ${detail}`);
    }
    return "SMS";
  }
}

export class UnifonicSmsOtpProvider implements OtpProvider {
  constructor(
    private appSid: string,
    private senderId: string
  ) {}

  async send(phone: string, code: string): Promise<OtpDeliveryChannel> {
    const url = "https://el.cloud.unifonic.com/rest/SMS/messages";
    const body = new URLSearchParams({
      AppSid: this.appSid,
      SenderID: this.senderId,
      Body: `رمز التحقق لخرسانة برو: ${code}`,
      Recipient: phone,
      responseType: "JSON",
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;
    if (!res.ok || !data?.success) {
      throw new Error(`Unifonic SMS send failed (${res.status}): ${data?.message ?? res.statusText}`);
    }
    return "SMS";
  }
}

class FallbackOtpProvider implements OtpProvider {
  constructor(
    private primary: OtpProvider,
    private fallback: OtpProvider
  ) {}

  async send(phone: string, code: string): Promise<OtpDeliveryChannel> {
    try {
      return await this.primary.send(phone, code);
    } catch (error) {
      console.error("Primary OTP channel failed; using configured fallback", error);
      return this.fallback.send(phone, code);
    }
  }
}

function createSmsProvider(): OtpProvider | null {
  const { UNIFONIC_APP_SID, UNIFONIC_SENDER_ID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM } =
    process.env;
  if (UNIFONIC_APP_SID && UNIFONIC_SENDER_ID) {
    return new UnifonicSmsOtpProvider(UNIFONIC_APP_SID, UNIFONIC_SENDER_ID);
  }
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_SMS_FROM) {
    return new TwilioSmsOtpProvider(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM);
  }
  return null;
}

function developmentFallback(): OtpProvider {
  return process.env.NODE_ENV === "production"
    ? new UnavailableOtpProvider()
    : new ConsoleOtpProvider();
}

export function createOtpProvider(): OtpProvider {
  const {
    META_WHATSAPP_ACCESS_TOKEN,
    META_WHATSAPP_PHONE_NUMBER_ID,
    META_WHATSAPP_OTP_TEMPLATE = "kharasana_pro_otp",
    META_WHATSAPP_TEMPLATE_LANGUAGE = "ar",
    META_GRAPH_API_VERSION = "v24.0",
    OTP_DELIVERY_CHANNEL = "whatsapp",
    OTP_ALLOW_SMS_FALLBACK,
  } = process.env;

  const whatsapp =
    META_WHATSAPP_ACCESS_TOKEN && META_WHATSAPP_PHONE_NUMBER_ID
      ? new MetaWhatsAppOtpProvider(
          META_WHATSAPP_ACCESS_TOKEN,
          META_WHATSAPP_PHONE_NUMBER_ID,
          META_WHATSAPP_OTP_TEMPLATE,
          META_WHATSAPP_TEMPLATE_LANGUAGE,
          META_GRAPH_API_VERSION
        )
      : null;
  const sms = createSmsProvider();
  const mode = OTP_DELIVERY_CHANNEL.toLowerCase();

  if (mode === "sms") return sms ?? developmentFallback();
  if (mode === "auto") return whatsapp ?? sms ?? developmentFallback();
  if (whatsapp && OTP_ALLOW_SMS_FALLBACK === "true" && sms) {
    return new FallbackOtpProvider(whatsapp, sms);
  }
  return whatsapp ?? developmentFallback();
}

export const otpProvider: OtpProvider = createOtpProvider();
