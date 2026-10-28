import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";
import {
  canTransitionDelivery,
  isDeliveryStatus,
  type DeliveryActorRole,
  type DeliveryStatus,
} from "@/lib/delivery-status";

const updateSchema = z.object({
  status: z.string(),
  note: z.string().trim().max(500).optional(),
});

async function getParticipant(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      acceptedQuote: {
        include: { company: { select: { userId: true, name: true } } },
      },
    },
  });
  if (!order || !order.acceptedQuote) return null;
  if (order.customerId === userId) {
    return { order, role: "CUSTOMER" as const };
  }
  if (order.acceptedQuote.company.userId === userId) {
    return { order, role: "COMPANY" as const };
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const participant = await getParticipant(id, user.id);
  if (!participant) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }

  const events = await prisma.deliveryEvent.findMany({
    where: { orderId: id },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      actorUserId: true,
      actor: { select: { role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    ok: true,
    currentStatus: participant.order.deliveryStatus,
    actorRole: participant.role,
    events: events.map((event) => ({
      id: event.id,
      status: event.status,
      note: event.note,
      createdAt: event.createdAt,
      isMine: event.actorUserId === user.id,
      actorRole: event.actor.role,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const participant = await getParticipant(id, user.id);
  if (!participant) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }
  if (!["ACCEPTED", "COMPLETED"].includes(participant.order.status)) {
    return NextResponse.json({ ok: false, error: "التوريد غير متاح في حالة الطلب الحالية" }, { status: 409 });
  }

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success || !isDeliveryStatus(parsed.data.status)) {
    return NextResponse.json({ ok: false, error: "حالة التوريد غير صالحة" }, { status: 400 });
  }

  const current = participant.order.deliveryStatus as DeliveryStatus;
  const next = parsed.data.status;
  if (!isDeliveryStatus(current) || !canTransitionDelivery(current, next, participant.role as DeliveryActorRole)) {
    return NextResponse.json({ ok: false, error: "لا يمكن تنفيذ هذه الخطوة من حسابك أو من الحالة الحالية" }, { status: 409 });
  }

  if (next === "DELIVERED") {
    const loads = await prisma.deliveryLoad.findMany({
      where: { orderId: id, status: { not: "CANCELLED" } },
      select: { status: true, receivedQuantityM3: true },
    });
    if (loads.length > 0) {
      if (loads.some((load) => load.status !== "RECEIVED")) {
        return NextResponse.json(
          { ok: false, error: "يجب تأكيد استلام جميع الشاحنات قبل إكمال الطلب" },
          { status: 409 }
        );
      }
      const receivedTotal = loads.reduce(
        (sum, load) => sum + (load.receivedQuantityM3 ?? 0),
        0
      );
      if (receivedTotal < participant.order.quantityM3 * 0.95) {
        return NextResponse.json(
          { ok: false, error: "إجمالي الكمية المستلمة أقل من الطلب. سجل مشكلة أو أضف دفعة تعويضية" },
          { status: 409 }
        );
      }
    }
  }

  const note = parsed.data.note?.trim() || null;
  if ((next === "ISSUE_REPORTED" || current === "ISSUE_REPORTED") && (!note || note.length < 5)) {
    return NextResponse.json({ ok: false, error: "الملاحظة إلزامية عند تسجيل المشكلة أو معالجتها" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id },
      data: {
        deliveryStatus: next,
        deliveredAt: next === "DELIVERED" ? new Date() : participant.order.deliveredAt,
        status: next === "DELIVERED" ? "COMPLETED" : participant.order.status,
      },
    });
    await tx.deliveryEvent.create({
      data: { orderId: id, actorUserId: user.id, status: next, note },
    });
    return order;
  });

  await logAudit({
    actorUserId: user.id,
    action: next === "ISSUE_REPORTED" ? "DELIVERY_ISSUE_REPORTED" : "DELIVERY_STATUS_UPDATED",
    entityType: "Order",
    entityId: id,
    before: { deliveryStatus: current, orderStatus: participant.order.status },
    after: { deliveryStatus: next, orderStatus: updated.status, note },
  });

  const recipientId =
    participant.role === "CUSTOMER"
      ? participant.order.acceptedQuote!.company.userId
      : participant.order.customerId;
  await notify({
    userId: recipientId,
    type: "DELIVERY_STATUS_UPDATED",
    title: next === "ISSUE_REPORTED" ? "تم تسجيل ملاحظة على التوريد" : "تحديث جديد على التوريد",
    body: `تم تحديث حالة توريد الطلب ${participant.order.code}.`,
    meta: { orderId: id, deliveryStatus: next },
  });

  return NextResponse.json({ ok: true, order: updated });
}
