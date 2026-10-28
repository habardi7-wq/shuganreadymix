import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";
import { logAudit } from "@/lib/audit";
import {
  canTransitionCommission,
  isCommissionStatus,
  type CommissionStatus,
} from "@/lib/commission-status";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAdminPermission("FINANCE_CORRECT");
  if (!user) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const nextStatus = body?.status;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!isCommissionStatus(nextStatus)) {
    return NextResponse.json({ ok: false, error: "حالة مالية غير صالحة" }, { status: 400 });
  }
  if (reason.length < 5) {
    return NextResponse.json(
      { ok: false, error: "سبب التعديل إلزامي ويجب ألا يقل عن 5 أحرف" },
      { status: 400 }
    );
  }

  const commission = await prisma.commission.findUnique({ where: { id } });
  if (!commission) {
    return NextResponse.json({ ok: false, error: "العمولة غير موجودة" }, { status: 404 });
  }

  const currentStatus = commission.status as CommissionStatus;
  if (!isCommissionStatus(currentStatus) || !canTransitionCommission(currentStatus, nextStatus)) {
    return NextResponse.json(
      { ok: false, error: "الحالة الجديدة مطابقة للحالة الحالية أو غير صالحة" },
      { status: 409 }
    );
  }

  const confirmedAt =
    nextStatus === "PENDING" || nextStatus === "CANCELLED"
      ? null
      : commission.confirmedAt ?? new Date();

  const updated = await prisma.commission.update({
    where: { id },
    data: { status: nextStatus, confirmedAt },
  });

  await logAudit({
    actorUserId: user.id,
    action:
      nextStatus === "CANCELLED"
        ? "COMMISSION_CANCELLED"
        : currentStatus === "CANCELLED"
          ? "COMMISSION_RESTORED"
          : "COMMISSION_STATUS_CORRECTED",
    entityType: "Commission",
    entityId: commission.id,
    before: {
      status: currentStatus,
      amount: commission.amount,
      confirmedAt: commission.confirmedAt,
    },
    after: {
      status: nextStatus,
      amount: updated.amount,
      confirmedAt: updated.confirmedAt,
      reason,
    },
  });

  return NextResponse.json({ ok: true, commission: updated });
}
