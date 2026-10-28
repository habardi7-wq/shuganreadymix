import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";

const schema = z.object({
  category: z.enum(["DELIVERY", "QUALITY", "QUANTITY", "BILLING", "SERVICE", "OTHER"]),
  description: z.string().trim().min(10).max(3000),
  deliveryLoadId: z.string().trim().min(1).optional(),
  requestedAdjustmentSar: z.coerce.number().min(0).max(1000000).optional(),
});

async function participant(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { acceptedQuote: { include: { company: { select: { userId: true } } } } },
  });
  if (!order?.acceptedQuote) return null;
  if (order.customerId === userId) return { order, otherUserId: order.acceptedQuote.company.userId };
  if (order.acceptedQuote.company.userId === userId) return { order, otherUserId: order.customerId };
  return null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
  const { id } = await params;
  if (!await participant(id, user.id)) return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  const complaints = await prisma.complaint.findMany({
    where: { orderId: id },
    include: { deliveryLoad: { select: { sequence: true, truckNumber: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ok: true, complaints });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
  const { id } = await params;
  const involved = await participant(id, user.id);
  if (!involved) return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "تحقق من نوع الشكوى والتفاصيل (10 أحرف على الأقل)" }, { status: 400 });
  if (parsed.data.deliveryLoadId) {
    const load = await prisma.deliveryLoad.findFirst({ where: { id: parsed.data.deliveryLoadId, orderId: id }, select: { id: true } });
    if (!load) return NextResponse.json({ ok: false, error: "الشاحنة لا تتبع هذا الطلب" }, { status: 400 });
  }

  const complaint = await prisma.complaint.create({
    data: {
      orderId: id,
      deliveryLoadId: parsed.data.deliveryLoadId ?? null,
      reporterUserId: user.id,
      category: parsed.data.category,
      description: parsed.data.description,
      requestedAdjustmentSar: parsed.data.requestedAdjustmentSar ?? null,
    },
    include: { deliveryLoad: { select: { sequence: true, truckNumber: true } } },
  });
  await logAudit({ actorUserId: user.id, action: "COMPLAINT_CREATED", entityType: "Complaint", entityId: complaint.id, after: complaint });
  await notify({
    userId: involved.otherUserId,
    type: "ORDER_COMPLAINT_CREATED",
    title: "تم تسجيل شكوى على الطلب",
    body: `تم تسجيل شكوى على الطلب ${involved.order.code}.`,
    meta: { orderId: id, complaintId: complaint.id },
  });
  return NextResponse.json({ ok: true, complaint }, { status: 201 });
}
