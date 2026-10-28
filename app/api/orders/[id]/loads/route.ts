import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";

const createSchema = z.object({
  plannedQuantityM3: z.coerce.number().positive().max(1000),
  truckNumber: z.string().trim().min(2).max(40).optional(),
  note: z.string().trim().max(500).optional(),
});

async function getParticipant(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      acceptedQuote: {
        include: { company: { select: { userId: true } } },
      },
    },
  });
  if (!order?.acceptedQuote) return null;
  if (order.customerId === userId) return { order, role: "CUSTOMER" as const };
  if (order.acceptedQuote.company.userId === userId) return { order, role: "COMPANY" as const };
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
  if (!participant) return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });

  const loads = await prisma.deliveryLoad.findMany({
    where: { orderId: id },
    orderBy: { sequence: "asc" },
  });

  const activeLoads = loads.filter((load) => load.status !== "CANCELLED");
  const plannedTotal = activeLoads.reduce((sum, load) => sum + load.plannedQuantityM3, 0);
  const receivedTotal = activeLoads.reduce((sum, load) => sum + (load.receivedQuantityM3 ?? 0), 0);

  return NextResponse.json({
    ok: true,
    role: participant.role,
    orderQuantityM3: participant.order.quantityM3,
    totals: { planned: plannedTotal, received: receivedTotal, remaining: Math.max(0, participant.order.quantityM3 - receivedTotal) },
    loads,
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
  if (!participant) return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  if (participant.role !== "COMPANY") {
    return NextResponse.json({ ok: false, error: "إضافة الشاحنات متاحة للمصنع فقط" }, { status: 403 });
  }
  if (participant.order.status !== "ACCEPTED") {
    return NextResponse.json({ ok: false, error: "لا يمكن إضافة شاحنة في حالة الطلب الحالية" }, { status: 409 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "بيانات الشاحنة أو الكمية غير صالحة" }, { status: 400 });
  }

  const existing = await prisma.deliveryLoad.findMany({
    where: { orderId: id },
    select: { sequence: true, plannedQuantityM3: true, status: true },
  });
  const activePlanned = existing
    .filter((load) => load.status !== "CANCELLED")
    .reduce((sum, load) => sum + load.plannedQuantityM3, 0);
  if (activePlanned + parsed.data.plannedQuantityM3 > participant.order.quantityM3 * 1.1) {
    return NextResponse.json(
      { ok: false, error: "إجمالي الكميات المخططة يتجاوز كمية الطلب بأكثر من 10٪" },
      { status: 409 }
    );
  }

  const sequence = Math.max(0, ...existing.map((load) => load.sequence)) + 1;
  const load = await prisma.$transaction(async (tx) => {
    const created = await tx.deliveryLoad.create({
      data: {
        orderId: id,
        sequence,
        plannedQuantityM3: parsed.data.plannedQuantityM3,
        truckNumber: parsed.data.truckNumber ?? null,
        note: parsed.data.note ?? null,
      },
    });
    if (participant.order.deliveryStatus === "NOT_SCHEDULED") {
      await tx.order.update({ where: { id }, data: { deliveryStatus: "SCHEDULED" } });
      await tx.deliveryEvent.create({
        data: { orderId: id, actorUserId: user.id, status: "SCHEDULED", note: "تم إنشاء أول دفعة توريد" },
      });
    }
    return created;
  });

  await logAudit({
    actorUserId: user.id,
    action: "DELIVERY_LOAD_CREATED",
    entityType: "DeliveryLoad",
    entityId: load.id,
    after: {
      orderId: id,
      sequence,
      plannedQuantityM3: load.plannedQuantityM3,
      truckNumber: load.truckNumber,
    },
  });

  await notify({
    userId: participant.order.customerId,
    type: "DELIVERY_LOAD_CREATED",
    title: "تمت إضافة شاحنة للتوريد",
    body: `أضاف المصنع الشاحنة رقم ${sequence} للطلب ${participant.order.code}.`,
    meta: { orderId: id, loadId: load.id },
  });

  return NextResponse.json({ ok: true, load }, { status: 201 });
}
