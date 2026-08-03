import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { logAudit } from "@/lib/audit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireRole("CUSTOMER");
  if (!user) return response;

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.customerId !== user.id) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }
  if (order.status !== "ACCEPTED") {
    return NextResponse.json(
      { ok: false, error: "لا يمكن إتمام هذا الطلب في حالته الحالية" },
      { status: 409 }
    );
  }

  await prisma.order.update({ where: { id }, data: { status: "COMPLETED" } });

  await logAudit({
    actorUserId: user.id,
    action: "ORDER_COMPLETED",
    entityType: "Order",
    entityId: id,
    before: { status: "ACCEPTED" },
    after: { status: "COMPLETED" },
  });

  return NextResponse.json({ ok: true });
}
