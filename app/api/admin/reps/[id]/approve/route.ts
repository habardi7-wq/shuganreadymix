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
  if (!user) return response;

  const { id } = await params;
  const rep = await prisma.salesRep.findUnique({ where: { id } });
  if (!rep) {
    return NextResponse.json({ ok: false, error: "المندوب غير موجود" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.salesRep.update({ where: { id }, data: { status: "APPROVED" } }),
    prisma.user.update({ where: { id: rep.userId }, data: { status: "ACTIVE" } }),
  ]);

  await logAudit({
    actorUserId: user.id,
    action: "REP_APPROVED",
    entityType: "SalesRep",
    entityId: id,
    before: { status: rep.status },
    after: { status: "APPROVED" },
  });

  await notify({
    userId: rep.userId,
    type: "REP_APPROVED",
    title: "تم اعتماد حسابك كمندوب مبيعات",
    body: "تهانينا! تم اعتماد حسابك، شارك رابط الإحالة الخاص بك الآن.",
  });

  return NextResponse.json({ ok: true });
}
