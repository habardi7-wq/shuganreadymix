import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";
import { createCommissionSettingSchema } from "@/lib/validation/commission";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const { user, response } = await requireAdminPermission("FINANCE_VIEW");
  if (!user || !response) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 403 });

  const settings = await prisma.commissionSetting.findMany({
    include: { company: { select: { name: true } } },
    orderBy: [{ scope: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ok: true, settings });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAdminPermission("FINANCE_SETTINGS");
  if (!user || !response) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = createCommissionSettingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "بيانات غير صالحة", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (data.scope === "COMPANY" && !data.companyId) {
    return NextResponse.json({ ok: false, error: "حدد الشركة" }, { status: 400 });
  }

  const setting = await prisma.commissionSetting.create({
    data: {
      scope: data.scope,
      companyId: data.scope === "COMPANY" ? data.companyId : null,
      type: data.type,
      value: data.value,
      isActive: true,
    },
  });

  await logAudit({
    actorUserId: user.id,
    action: "COMMISSION_SETTING_CREATED",
    entityType: "CommissionSetting",
    entityId: setting.id,
    after: setting,
  });

  return NextResponse.json({ ok: true, setting });
}
