import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAdminPermission("APPROVALS_MANAGE");
  if (!user || !response) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 403 });

  const { id } = await params;
  const rep = await prisma.salesRep.findUnique({ where: { id } });
  if (!rep) {
    return NextResponse.json({ ok: false, error: "المندوب غير موجود" }, { status: 404 });
  }

  await prisma.salesRep.update({ where: { id }, data: { status: "REJECTED" } });

  await logAudit({
    actorUserId: user.id,
    action: "REP_REJECTED",
    entityType: "SalesRep",
    entityId: id,
    before: { status: rep.status },
    after: { status: "REJECTED" },
  });

  await notify({
    userId: rep.userId,
    type: "REP_REJECTED",
    title: "تعذر اعتماد حسابك كمندوب",
    body: "لم يتم اعتماد طلبك حاليًا. تواصل مع الدعم لمزيد من التفاصيل.",
  });

  return NextResponse.json({ ok: true });
}
