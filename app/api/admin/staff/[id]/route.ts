import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";
import { logAudit } from "@/lib/audit";
import { normalizeAdminPermissions } from "@/lib/admin-permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAdminPermission("STAFF_PERMISSIONS_MANAGE");
  if (!user) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const adminLevel = body?.adminLevel;
  const adminGrade = Number(body?.adminGrade);
  const status = body?.status;
  const permissions = normalizeAdminPermissions(body?.permissions);

  if (!["MANAGER", "STAFF"].includes(adminLevel)) {
    return NextResponse.json({ ok: false, error: "المستوى الوظيفي غير صالح" }, { status: 400 });
  }
  if (!Number.isInteger(adminGrade) || adminGrade < 1 || adminGrade > 5 || !permissions) {
    return NextResponse.json({ ok: false, error: "الدرجة أو الصلاحيات غير صالحة" }, { status: 400 });
  }
  if (!["ACTIVE", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ ok: false, error: "حالة الموظف غير صالحة" }, { status: 400 });
  }
  if (reason.length < 5) {
    return NextResponse.json({ ok: false, error: "سبب التعديل إلزامي" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "الموظف غير موجود" }, { status: 404 });
  }
  if (target.adminLevel === "SUPER_ADMIN") {
    return NextResponse.json(
      { ok: false, error: "لا يمكن تعديل حساب مدير التطبيق الأعلى من شاشة الموظفين" },
      { status: 403 }
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      adminLevel,
      adminGrade,
      status,
      permissions: JSON.stringify(permissions),
    },
    select: { id: true, name: true, email: true, status: true, adminLevel: true, adminGrade: true, permissions: true },
  });

  await logAudit({
    actorUserId: user.id,
    action: "ADMIN_STAFF_PERMISSIONS_UPDATED",
    entityType: "User",
    entityId: target.id,
    before: {
      adminLevel: target.adminLevel,
      adminGrade: target.adminGrade,
      status: target.status,
      permissions: target.permissions,
    },
    after: { ...updated, permissions, reason },
  });

  return NextResponse.json({ ok: true, staff: updated });
}
