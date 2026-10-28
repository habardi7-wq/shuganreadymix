import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";
import { updateCommissionSettingSchema } from "@/lib/validation/commission";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAdminPermission("FINANCE_SETTINGS");
  if (!user || !response) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.commissionSetting.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "الإعداد غير موجود" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = updateCommissionSettingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "بيانات غير صالحة", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const updated = await prisma.commissionSetting.update({
    where: { id },
    data: parsed.data,
  });

  await logAudit({
    actorUserId: user.id,
    action: "COMMISSION_SETTING_UPDATED",
    entityType: "CommissionSetting",
    entityId: id,
    before: existing,
    after: updated,
  });

  return NextResponse.json({ ok: true, setting: updated });
}
