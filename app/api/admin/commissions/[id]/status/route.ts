import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
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
  const { user, response } = await requireRole("ADMIN");
  if (!user) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const nextStatus = body?.status;

  if (!isCommissionStatus(nextStatus)) {
    return NextResponse.json({ ok: false, error: "حالة مالية غير صالحة" }, { status: 400 });
  }

  const commission = await prisma.commission.findUnique({ where: { id } });
  if (!commission) {
    return NextResponse.json({ ok: false, error: "العمولة غير موجودة" }, { status: 404 });
  }

  const currentStatus = commission.status as CommissionStatus;
  if (!isCommissionStatus(currentStatus) || !canTransitionCommission(currentStatus, nextStatus)) {
    return NextResponse.json(
      { ok: false, error: "لا يمكن تنفيذ هذا الانتقال المالي" },
      { status: 409 }
    );
  }

  const updated = await prisma.commission.update({
    where: { id },
    data: {
      status: nextStatus,
      confirmedAt: nextStatus === "CONFIRMED" ? new Date() : commission.confirmedAt,
    },
  });

  await logAudit({
    actorUserId: user.id,
    action: nextStatus === "CONFIRMED" ? "COMMISSION_CONFIRMED" : "COMMISSION_PAID",
    entityType: "Commission",
    entityId: commission.id,
    before: { status: currentStatus, amount: commission.amount },
    after: { status: nextStatus, amount: updated.amount },
  });

  return NextResponse.json({ ok: true, commission: updated });
}
