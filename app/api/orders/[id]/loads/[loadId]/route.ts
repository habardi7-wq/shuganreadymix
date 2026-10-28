import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";
import {
  canTransitionDeliveryLoad,
  isDeliveryLoadStatus,
  type DeliveryLoadActor,
  type DeliveryLoadStatus,
} from "@/lib/delivery-load-status";

const updateSchema = z.object({
  status: z.string(),
  note: z.string().trim().max(500).optional(),
  receivedQuantityM3: z.coerce.number().positive().max(1000).optional(),
  plannedQuantityM3: z.coerce.number().positive().max(1000).optional(),
  truckNumber: z.string().trim().min(2).max(40).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; loadId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });

  const { id: orderId, loadId } = await params;
  const load = await prisma.deliveryLoad.findFirst({
    where: { id: loadId, orderId },
    include: {
      order: {
        include: {
          acceptedQuote: {
            include: { company: { select: { userId: true } } },
          },
        },
      },
    },
  });
  if (!load?.order.acceptedQuote) {
    return NextResponse.json({ ok: false, error: "دفعة التوريد غير موجودة" }, { status: 404 });
  }

  const role: DeliveryLoadActor | null =
    load.order.customerId === user.id
      ? "CUSTOMER"
      : load.order.acceptedQuote.company.userId === user.id
        ? "COMPANY"
        : null;
  if (!role) return NextResponse.json({ ok: false, error: "دفعة التوريد غير موجودة" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success || !isDeliveryLoadStatus(parsed.data.status)) {
    return NextResponse.json({ ok: false, error: "بيانات التحديث غير صالحة" }, { status: 400 });
  }

  const current = load.status as DeliveryLoadStatus;
  const next = parsed.data.status;
  const isCorrection =
    current === next &&
    role === "COMPANY" &&
    current === "PLANNED" &&
    (parsed.data.plannedQuantityM3 !== undefined || parsed.data.truckNumber !== undefined);

  if (!isDeliveryLoadStatus(current) || (!isCorrection && !canTransitionDeliveryLoad(current, next, role))) {
    return NextResponse.json({ ok: false, error: "لا يمكن تنفيذ هذا التحديث من حسابك أو من الحالة الحالية" }, { status: 409 });
  }

  const note = parsed.data.note?.trim() || null;
  if (
    (isCorrection || next === "ISSUE_REPORTED" || next === "CANCELLED" || current === "ISSUE_REPORTED" || current === "CANCELLED") &&
    (!note || note.length < 5)
  ) {
    return NextResponse.json({ ok: false, error: "سبب التعديل أو المشكلة إلزامي ولا يقل عن 5 أحرف" }, { status: 400 });
  }

  if (next === "RECEIVED" && role === "CUSTOMER" && parsed.data.receivedQuantityM3 === undefined) {
    return NextResponse.json({ ok: false, error: "أدخل الكمية المستلمة فعلياً" }, { status: 400 });
  }
  if (
    parsed.data.receivedQuantityM3 !== undefined &&
    parsed.data.receivedQuantityM3 > load.plannedQuantityM3 * 1.1
  ) {
    return NextResponse.json({ ok: false, error: "الكمية المستلمة تتجاوز المخطط بأكثر من 10٪" }, { status: 409 });
  }

  if (isCorrection && parsed.data.plannedQuantityM3 !== undefined) {
    const otherPlanned = await prisma.deliveryLoad.aggregate({
      where: { orderId, id: { not: loadId }, status: { not: "CANCELLED" } },
      _sum: { plannedQuantityM3: true },
    });
    if ((otherPlanned._sum.plannedQuantityM3 ?? 0) + parsed.data.plannedQuantityM3 > load.order.quantityM3 * 1.1) {
      return NextResponse.json({ ok: false, error: "التصحيح يرفع إجمالي المخطط فوق حد الطلب" }, { status: 409 });
    }
  }

  const now = new Date();
  const orderDeliveryStatus =
    next === "DISPATCHED"
      ? "DISPATCHED"
      : next === "ARRIVED" || next === "RECEIVED"
        ? "ARRIVED"
        : next === "ISSUE_REPORTED"
          ? "ISSUE_REPORTED"
          : next === "PLANNED"
            ? "SCHEDULED"
            : load.order.deliveryStatus;

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.deliveryLoad.update({
      where: { id: loadId },
      data: {
        status: next,
        note: note ?? load.note,
        plannedQuantityM3: isCorrection ? parsed.data.plannedQuantityM3 ?? load.plannedQuantityM3 : load.plannedQuantityM3,
        truckNumber: isCorrection ? parsed.data.truckNumber ?? load.truckNumber : load.truckNumber,
        receivedQuantityM3: next === "RECEIVED" ? parsed.data.receivedQuantityM3 : load.receivedQuantityM3,
        dispatchedAt: next === "DISPATCHED" ? now : load.dispatchedAt,
        arrivedAt: next === "ARRIVED" ? now : load.arrivedAt,
        receivedAt: next === "RECEIVED" ? now : load.receivedAt,
      },
    });

    if (!isCorrection && orderDeliveryStatus !== load.order.deliveryStatus) {
      await tx.order.update({ where: { id: orderId }, data: { deliveryStatus: orderDeliveryStatus } });
      await tx.deliveryEvent.create({
        data: { orderId, actorUserId: user.id, status: orderDeliveryStatus, note: `تحديث الشاحنة رقم ${load.sequence}${note ? `: ${note}` : ""}` },
      });
    }
    return item;
  });

  await logAudit({
    actorUserId: user.id,
    action: isCorrection ? "DELIVERY_LOAD_CORRECTED" : "DELIVERY_LOAD_STATUS_UPDATED",
    entityType: "DeliveryLoad",
    entityId: loadId,
    before: {
      status: current,
      plannedQuantityM3: load.plannedQuantityM3,
      receivedQuantityM3: load.receivedQuantityM3,
      truckNumber: load.truckNumber,
    },
    after: {
      status: updated.status,
      plannedQuantityM3: updated.plannedQuantityM3,
      receivedQuantityM3: updated.receivedQuantityM3,
      truckNumber: updated.truckNumber,
      reason: note,
    },
  });

  const recipientId = role === "COMPANY" ? load.order.customerId : load.order.acceptedQuote.company.userId;
  await notify({
    userId: recipientId,
    type: "DELIVERY_LOAD_UPDATED",
    title: next === "ISSUE_REPORTED" ? "مشكلة في إحدى دفعات التوريد" : "تحديث على شاحنة التوريد",
    body: `تم تحديث الشاحنة رقم ${load.sequence} للطلب ${load.order.code}.`,
    meta: { orderId, loadId, status: next },
  });

  return NextResponse.json({ ok: true, load: updated });
}
