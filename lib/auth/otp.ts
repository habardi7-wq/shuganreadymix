import { prisma } from "@/lib/prisma";
import { otpProvider } from "@/lib/notifications/otp-provider";
import type { OtpPurpose } from "@/lib/enums";

const CODE_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_REQUESTS_PER_WINDOW = 5;
const REQUEST_WINDOW_MINUTES = 15;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class OtpRateLimitError extends Error {}

export async function requestOtp(phone: string, purpose: OtpPurpose) {
  const windowStart = new Date(Date.now() - REQUEST_WINDOW_MINUTES * 60_000);
  const recent = await prisma.otpCode.findMany({
    where: { phone, purpose, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "desc" },
  });

  if (recent.length > 0) {
    const last = recent[0];
    const secondsSinceLast = (Date.now() - last.createdAt.getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      throw new OtpRateLimitError(
        `يرجى الانتظار ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)} ثانية قبل إعادة الإرسال`
      );
    }
  }

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new OtpRateLimitError("عدد محاولات كبير، حاول لاحقًا");
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  await prisma.otpCode.create({
    data: { phone, purpose, code, expiresAt },
  });

  await otpProvider.send(phone, code);

  return {
    expiresAt,
    // Only surfaced outside production so the demo can be tested end-to-end
    // without a real SMS gateway wired up yet.
    devCode: process.env.NODE_ENV === "production" ? undefined : code,
  };
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "INVALID_CODE" };

// Purpose is recorded on the code (for audit trail) but not used to filter
// here: a phone number only ever has one live OTP flow at a time, so we just
// take the most recent unconsumed code regardless of why it was requested.
export async function verifyOtp(phone: string, code: string): Promise<OtpVerifyResult> {
  const record = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, reason: "NOT_FOUND" };

  if (record.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "EXPIRED" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  }

  if (record.code !== code) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "INVALID_CODE" };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true };
}
