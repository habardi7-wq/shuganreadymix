import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validation/auth";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email, role: "ADMIN" },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ ok: false, error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  if (user.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "الحساب غير مفعّل" }, { status: 403 });
  }

  await logAudit({ actorUserId: user.id, action: "ADMIN_LOGIN", entityType: "User", entityId: user.id });

  const token = await createSessionToken({ sub: user.id, role: "ADMIN" });
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, role: user.role, name: user.name, email: user.email },
  });

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
