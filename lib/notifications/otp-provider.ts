// OTP delivery is abstracted behind this interface so the mock (console-log)
// provider used in development/demo can be swapped for a real SMS/WhatsApp
// gateway (e.g. Unifonic, Twilio, Meta WhatsApp Cloud API) later without
// touching any business logic. Wire the real provider here based on env vars
// — never hardcode API keys in source, always read from process.env.

export interface OtpProvider {
  send(phone: string, code: string): Promise<void>;
}

class ConsoleOtpProvider implements OtpProvider {
  async send(phone: string, code: string): Promise<void> {
    console.log(`[OTP:DEV] ${phone} -> ${code}`);
  }
}

// Sends the OTP as a plain SMS via Twilio's REST API. No SDK dependency is
// needed for a single POST call. Enabled only when all three env vars are
// present (see .env.example) — otherwise the app falls back to the console
// provider, which is what every environment without real credentials uses.
class TwilioSmsOtpProvider implements OtpProvider {
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

function createOtpProvider(): OtpProvider {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_SMS_FROM) {
    return new TwilioSmsOtpProvider(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM);
  }
  return new ConsoleOtpProvider();
}

export const otpProvider: OtpProvider = createOtpProvider();
