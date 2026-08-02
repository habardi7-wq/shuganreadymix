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

export const otpProvider: OtpProvider = new ConsoleOtpProvider();
