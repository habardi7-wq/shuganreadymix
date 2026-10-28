import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOtpProvider,
  ConsoleOtpProvider,
  MetaWhatsAppOtpProvider,
  TwilioSmsOtpProvider,
  UnavailableOtpProvider,
  UnifonicSmsOtpProvider,
} from "./otp-provider";

const ENV_KEYS = [
  "UNIFONIC_APP_SID",
  "UNIFONIC_SENDER_ID",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_SMS_FROM",
  "META_WHATSAPP_ACCESS_TOKEN",
  "META_WHATSAPP_PHONE_NUMBER_ID",
  "META_WHATSAPP_OTP_TEMPLATE",
  "META_WHATSAPP_TEMPLATE_LANGUAGE",
  "META_GRAPH_API_VERSION",
  "OTP_DELIVERY_CHANNEL",
  "OTP_ALLOW_SMS_FALLBACK",
] as const;

function clearProviderEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe("createOtpProvider selection", () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) original[key] = process.env[key];
    clearProviderEnv();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  it("falls back to the console provider with no env vars set", () => {
    expect(createOtpProvider()).toBeInstanceOf(ConsoleOtpProvider);
  });

  it("uses Meta WhatsApp by default when configured", () => {
    process.env.META_WHATSAPP_ACCESS_TOKEN = "token";
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = "123456";
    expect(createOtpProvider()).toBeInstanceOf(MetaWhatsAppOtpProvider);
  });

  it("does not silently use an SMS provider while WhatsApp is selected", () => {
    process.env.UNIFONIC_APP_SID = "app-sid";
    process.env.UNIFONIC_SENDER_ID = "KharasanaPro";
    expect(createOtpProvider()).toBeInstanceOf(ConsoleOtpProvider);
  });

  it("uses Unifonic when SMS is explicitly selected", () => {
    process.env.OTP_DELIVERY_CHANNEL = "sms";
    process.env.UNIFONIC_APP_SID = "app-sid";
    process.env.UNIFONIC_SENDER_ID = "KharasanaPro";
    expect(createOtpProvider()).toBeInstanceOf(UnifonicSmsOtpProvider);
  });

  it("falls back to Twilio when SMS is selected and only Twilio is configured", () => {
    process.env.OTP_DELIVERY_CHANNEL = "sms";
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_SMS_FROM = "+10000000000";

    expect(createOtpProvider()).toBeInstanceOf(TwilioSmsOtpProvider);
  });

  it("fails closed in production when no delivery provider is configured", () => {
    const oldNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(createOtpProvider()).toBeInstanceOf(UnavailableOtpProvider);
    process.env.NODE_ENV = oldNodeEnv;
  });

  it("stays on the console provider when Unifonic env vars are only partially set", () => {
    process.env.UNIFONIC_APP_SID = "app-sid";
    // UNIFONIC_SENDER_ID intentionally missing
    expect(createOtpProvider()).toBeInstanceOf(ConsoleOtpProvider);
  });
});

describe("UnifonicSmsOtpProvider.send", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("posts the expected fields and succeeds on a { success: true } response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ success: true, errorCode: "ER-00", data: {} }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new UnifonicSmsOtpProvider("app-sid", "KharasanaPro");
    await expect(provider.send("966554974814", "123456")).resolves.toBe("SMS");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://el.cloud.unifonic.com/rest/SMS/messages");
    expect(options.method).toBe("POST");
    const sentBody = new URLSearchParams(options.body as string);
    expect(sentBody.get("AppSid")).toBe("app-sid");
    expect(sentBody.get("SenderID")).toBe("KharasanaPro");
    expect(sentBody.get("Recipient")).toBe("966554974814");
    expect(sentBody.get("Body")).toContain("123456");
  });

  it("throws when Unifonic responds with success: false", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ success: false, message: "Dest num is too short", errorCode: "ER-04" }),
    }) as unknown as typeof fetch;

    const provider = new UnifonicSmsOtpProvider("app-sid", "KharasanaPro");
    await expect(provider.send("123", "123456")).rejects.toThrow("Dest num is too short");
  });
});

describe("MetaWhatsAppOtpProvider.send", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends the approved authentication template with body and copy-code values", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" });
    global.fetch = fetchMock as unknown as typeof fetch;
    const provider = new MetaWhatsAppOtpProvider("secret-token", "phone-id", "kharasana_pro_otp", "ar", "v24.0");

    await expect(provider.send("966554974814", "123456")).resolves.toBe("WHATSAPP");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v24.0/phone-id/messages");
    expect(options.headers.Authorization).toBe("Bearer secret-token");
    const body = JSON.parse(options.body as string);
    expect(body.to).toBe("966554974814");
    expect(body.template.name).toBe("kharasana_pro_otp");
    expect(body.template.language.code).toBe("ar");
    expect(body.template.components[0].parameters[0].text).toBe("123456");
    expect(body.template.components[1].parameters[0].text).toBe("123456");
  });

  it("throws without exposing the access token when Meta rejects the request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '{"error":{"message":"template not found"}}',
    }) as unknown as typeof fetch;
    const provider = new MetaWhatsAppOtpProvider("secret-token", "phone-id", "missing", "ar", "v24.0");

    await expect(provider.send("966554974814", "123456")).rejects.toThrow("template not found");
    await expect(provider.send("966554974814", "123456")).rejects.not.toThrow("secret-token");
  });
});
