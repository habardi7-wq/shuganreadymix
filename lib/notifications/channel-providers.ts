// Stub infrastructure for external notification channels. Each provider is a
// thin interface; a real integration (e.g. SMTP/Resend for email, WhatsApp
// Cloud API for WhatsApp) can implement it and be swapped in via env vars
// without changing any code that calls `notify()` in lib/notifications/service.ts.
// No credentials are read/embedded here — only process.env lookups happen at
// the call site of a real implementation.

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

export const emailProvider: EmailProvider = new NoopEmailProvider();
export const whatsappProvider: WhatsAppProvider = new NoopWhatsAppProvider();
