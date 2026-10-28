import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";
import { logAudit } from "@/lib/audit";
import { normalizeAdminPermissions } from "@/lib/admin-permissions";

export async function GET() {
  const { user, response } = await requireAdminPermission("STAFF_PERMISSIONS_MANAGE");
  if (!user) return response ?? NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 403 });

  const staff = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      adminLevel: true,
      adminGrade: true,
      permissions: true,
      createdAt: true,
    },
    orderBy: [{ adminGrade: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ ok: true, staff });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAdminPermission("STAFF_PERMISSIONS_MANAGE");
  if (!user) return response ?? NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const adminLevel = body?.adminLevel === "MANAGER" ? "MANAGER" : "STAFF";
  const adminGrade = Number(body?.adminGrade);
  const permissions = normalizeAdminPermissions(body?.permissions);

  if (!name || !email.includes("@") || password.length < 10) {
    return NextResponse.json(
      { ok: false, error: "الاسم والبريد وكلمة مرور من 10 أحرف على الأقل مطلوبة" },
      { status: 400 }
    );
  }
  if (!Number.isInteger(adminGrade) || adminGrade < 1 || adminGrade > 5 || !permissions) {
    return NextResponse.json({ ok: false, error: "الدرجة أو الصلاحيات غير صالحة" }, { status: 400 });
  }
  if (reason.length < 5) {
    return NextResponse.json({ ok: false, error: "سبب إنشاء الموظف إلزامي" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ ok: false, error: "البريد مستخدم مسبقاً" }, { status: 409 });
  }

  const staff = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
      status: "ACTIVE",
      adminLevel,
      adminGrade,
      permissions: JSON.stringify(permissions),
    },
    select: { id: true, name: true, email: true, status: true, adminLevel: true, adminGrade: true, permissions: true },
  });

  await logAudit({
    actorUserId: user.id,
    action: "ADMIN_STAFF_CREATED",
    entityType: "User",
    entityId: staff.id,
    after: { ...staff, permissions, reason },
  });

  return NextResponse.json({ ok: true, staff }, { status: 201 });
}
