import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOtpProvider,
  ConsoleOtpProvider,
  TwilioSmsOtpProvider,
  UnifonicSmsOtpProvider,
} from "./otp-provider";

const ENV_KEYS = [
  "UNIFONIC_APP_SID",
  "UNIFONIC_SENDER_ID",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_SMS_FROM",
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

  it("prefers Unifonic when both Unifonic and Twilio env vars are set", () => {
    process.env.UNIFONIC_APP_SID = "app-sid";
    process.env.UNIFONIC_SENDER_ID = "KharasanaPro";
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_SMS_FROM = "+10000000000";

    expect(createOtpProvider()).toBeInstanceOf(UnifonicSmsOtpProvider);
  });

  it("falls back to Twilio when only Twilio env vars are set", () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_SMS_FROM = "+10000000000";

    expect(createOtpProvider()).toBeInstanceOf(TwilioSmsOtpProvider);
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
    await provider.send("966554974814", "123456");

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
