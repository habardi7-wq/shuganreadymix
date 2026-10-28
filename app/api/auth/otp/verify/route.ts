import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSaudiPhone } from "@/lib/phone";
import { otpVerifySchema } from "@/lib/validation/auth";
import { verifyOtp } from "@/lib/auth/otp";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";

function generateReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 7; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `KP-${out}`;
}

const REASON_MESSAGES: Record<string, string> = {
  NOT_FOUND: "لم يتم العثور على رمز تحقق، اطلب رمزًا جديدًا",
  EXPIRED: "انتهت صلاحية الرمز، اطلب رمزًا جديدًا",
  TOO_MANY_ATTEMPTS: "محاولات كثيرة جدًا، اطلب رمزًا جديدًا",
  INVALID_CODE: "الرمز غير صحيح",
};

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = otpVerifySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "بيانات غير صالحة", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const phone = normalizeSaudiPhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ ok: false, error: "رقم جوال غير صالح" }, { status: 400 });
  }

  const result = await verifyOtp(phone, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: REASON_MESSAGES[result.reason] },
      { status: 400 }
    );
  }

  const { role, name } = parsed.data;
  let user = await prisma.user.findFirst({ where: { phone, role } });
  let isNew = false;

  if (!user) {
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "الاسم مطلوب عند إنشاء حساب جديد" },
        { status: 400 }
      );
    }

    isNew = true;
    const status = role === "CUSTOMER" ? "ACTIVE" : "PENDING_APPROVAL";

    user = await prisma.user.create({
      data: { phone, role, name, status },
    });

    if (role === "SALES_REP") {
      await prisma.salesRep.create({
        data: { userId: user.id, referralCode: generateReferralCode() },
      });
    }

    await logAudit({
      actorUserId: user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
      after: { phone, role, status },
    });

    await notify({
      userId: user.id,
      type: "WELCOME",
      title: "مرحبًا بك في خرسانة برو",
      body:
        role === "CUSTOMER"
          ? "تم إنشاء حسابك بنجاح، يمكنك الآن إرسال طلب خرسانة."
          : "تم استلام طلب التسجيل، سيتم مراجعته من الإدارة قبل التفعيل.",
    });
  } else {
    if (user.status === "SUSPENDED" || user.status === "REJECTED") {
      return NextResponse.json(
        { ok: false, error: "الحساب موقوف أو مرفوض، تواصل مع الدعم" },
        { status: 403 }
      );
    }
    await logAudit({
      actorUserId: user.id,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user.id,
    });
  }

  const token = await createSessionToken({ sub: user.id, role: user.role as never });

  const res = NextResponse.json({
    ok: true,
    isNew,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      status: user.status,
      phone: user.phone,
    },
  });

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
