import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSaudiPhone } from "@/lib/phone";
import { otpRequestSchema } from "@/lib/validation/auth";
import { requestOtp, OtpRateLimitError } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = otpRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "بيانات غير صالحة", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const phone = normalizeSaudiPhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "رقم جوال سعودي غير صالح" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: { phone, role: parsed.data.role },
  });
  const purpose = existing ? "LOGIN" : "REGISTER";

  try {
    const { expiresAt, devCode } = await requestOtp(phone, purpose);
    return NextResponse.json({ ok: true, purpose, expiresAt, devCode });
  } catch (err) {
    if (err instanceof OtpRateLimitError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 429 });
    }
    throw err;
  }
}
