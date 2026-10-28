// Real infrastructure for external notification channels, each behind a thin
// interface so it can be swapped without touching any code that calls
// `notify()` in lib/notifications/service.ts. Every real implementation is
// enabled only when its env vars are present (see .env.example); otherwise
// the app falls back to a console-log stub. No credentials are read/embedded
// here beyond process.env lookups — never hardcode API keys in source.

export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

export interface WhatsAppProvider {
  send(phone: string, message: string): Promise<void>;
}

class NoopEmailProvider implements EmailProvider {
  async send(to: string, subject: string): Promise<void> {
    console.log(`[EMAIL:STUB] to=${to} subject="${subject}" (not sent - no provider configured)`);
  }
}

class NoopWhatsAppProvider implements WhatsAppProvider {
  async send(phone: string, message: string): Promise<void> {
    console.log(`[WHATSAPP:STUB] to=${phone} message="${message}" (not sent - no provider configured)`);
  }
}

// Sends via Resend's REST API (https://resend.com) with a single POST call,
// no SDK dependency required.
class ResendEmailProvider implements EmailProvider {
  constructor(
    private apiKey: string,
    private fromEmail: string
  ) {}

  async send(to: string, subject: string, body: string): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to,
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend email send failed (${res.status}): ${detail}`);
    }
  }
}

// Sends via Twilio's WhatsApp API (same REST endpoint as SMS, "whatsapp:"
// prefixed numbers), no SDK dependency required.
class TwilioWhatsAppProvider implements WhatsAppProvider {
  constructor(
    private accountSid: string,
    private authToken: string,
    private fromNumber: string
  ) {}

  async send(phone: string, message: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
    const body = new URLSearchParams({
      To: `whatsapp:+${phone}`,
      From: `whatsapp:${this.fromNumber}`,
      Body: message,
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
      throw new Error(`Twilio WhatsApp send failed (${res.status}): ${detail}`);
    }
  }
}

function createEmailProvider(): EmailProvider {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
  if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
    return new ResendEmailProvider(RESEND_API_KEY, RESEND_FROM_EMAIL);
  }
  return new NoopEmailProvider();
}

function createWhatsAppProvider(): WhatsAppProvider {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM) {
    return new TwilioWhatsAppProvider(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM);
  }
  return new NoopWhatsAppProvider();
}

export const emailProvider: EmailProvider = createEmailProvider();
export const whatsappProvider: WhatsAppProvider = createWhatsAppProvider();
