// OTP delivery is abstracted behind this interface so the mock (console-log)
// provider used in development/demo can be swapped for a real SMS/WhatsApp
// gateway (e.g. Unifonic, Twilio, Meta WhatsApp Cloud API) later without
// touching any business logic. Wire the real provider here based on env vars
// — never hardcode API keys in source, always read from process.env.

export interface OtpProvider {
  send(phone: string, code: string): Promise<void>;
}

export class ConsoleOtpProvider implements OtpProvider {
  async send(phone: string, code: string): Promise<void> {
    console.log(`[OTP:DEV] ${phone} -> ${code}`);
  }
}

// Sends the OTP as a plain SMS via Twilio's REST API. No SDK dependency is
// needed for a single POST call. Enabled only when all three env vars are
// present (see .env.example) — otherwise the app falls back to the console
// provider, which is what every environment without real credentials uses.
export class TwilioSmsOtpProvider implements OtpProvider {
  constructor(
    private accountSid: string,
    private authToken: string,
    private fromNumber: string
  ) {}

  async send(phone: string, code: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
    const body = new URLSearchParams({
      To: `+${phone}`,
      From: this.fromNumber,
      Body: `رمز التحقق لخرسانة برو: ${code}`,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Twilio SMS send failed (${res.status}): ${detail}`);
    }
  }
}

// Sends the OTP as a plain SMS via Unifonic's REST API — a Saudi-focused SMS
// gateway, chosen for this deployment over Twilio for faster/cheaper local
// delivery to Saudi numbers. No SDK dependency needed for a single POST call.
export class UnifonicSmsOtpProvider implements OtpProvider {
  constructor(
    private appSid: string,
    private senderId: string
  ) {}

  async send(phone: string, code: string): Promise<void> {
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
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;
    if (!res.ok || !data?.success) {
      throw new Error(`Unifonic SMS send failed (${res.status}): ${data?.message ?? res.statusText}`);
    }
  }
}

// Preference order when multiple providers are configured: Unifonic (chosen
// for this deployment's Saudi numbers) first, then Twilio, then the console
// fallback used everywhere no real credentials are set.
export function createOtpProvider(): OtpProvider {
  const { UNIFONIC_APP_SID, UNIFONIC_SENDER_ID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM } =
    process.env;

  if (UNIFONIC_APP_SID && UNIFONIC_SENDER_ID) {
    return new UnifonicSmsOtpProvider(UNIFONIC_APP_SID, UNIFONIC_SENDER_ID);
  }
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_SMS_FROM) {
    return new TwilioSmsOtpProvider(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM);
  }
  return new ConsoleOtpProvider();
}

export const otpProvider: OtpProvider = createOtpProvider();
