import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";
import { canTransitionComplaint, isComplaintStatus, type ComplaintStatus } from "@/lib/complaint-status";

export async function GET() {
  const { user, response } = await requireAdminPermission("ORDERS_VIEW");
  if (!user) return response ?? NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 403 });
  const complaints = await prisma.complaint.findMany({
    include: {
      order: { select: { code: true, status: true, acceptedQuote: { select: { totalPrice: true } } } },
      deliveryLoad: { select: { sequence: true, truckNumber: true, plannedQuantityM3: true, receivedQuantityM3: true } },
      reporter: { select: { id: true, name: true, phone: true, role: true } },
      handler: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  return NextResponse.json({ ok: true, complaints });
}

const schema = z.object({
  status: z.string(),
  reason: z.string().trim().min(5).max(1000),
  approvedAdjustmentSar: z.coerce.number().min(0).max(1000000).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAdminPermission("ORDERS_EDIT");
  if (!user) return response ?? NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isComplaintStatus(parsed.data.status)) {
    return NextResponse.json({ ok: false, error: "بيانات معالجة الشكوى غير صالحة" }, { status: 400 });
  }
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { order: { include: { acceptedQuote: { select: { totalPrice: true } } } } },
  });
  if (!complaint) return NextResponse.json({ ok: false, error: "الشكوى غير موجودة" }, { status: 404 });
  const current = complaint.status as ComplaintStatus;
  const next = parsed.data.status;
  if (!isComplaintStatus(current) || !canTransitionComplaint(current, next)) {
    return NextResponse.json({ ok: false, error: "لا يمكن الانتقال من الحالة الحالية إلى الحالة المطلوبة" }, { status: 409 });
  }
  if (next !== "RESOLVED" && parsed.data.approvedAdjustmentSar !== undefined) {
    return NextResponse.json({ ok: false, error: "المبلغ المعتمد مسموح فقط عند إغلاق الشكوى كمنتهية" }, { status: 400 });
  }
  if (parsed.data.approvedAdjustmentSar !== undefined && parsed.data.approvedAdjustmentSar > (complaint.order.acceptedQuote?.totalPrice ?? 0)) {
    return NextResponse.json({ ok: false, error: "مبلغ التسوية لا يمكن أن يتجاوز قيمة عرض السعر المعتمد" }, { status: 400 });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      status: next,
      handlerUserId: user.id,
      resolutionNote: parsed.data.reason,
      approvedAdjustmentSar: next === "RESOLVED" ? parsed.data.approvedAdjustmentSar ?? null : null,
      closedAt: next === "RESOLVED" || next === "REJECTED" ? new Date() : null,
    },
  });
  await logAudit({
    actorUserId: user.id,
    action: current === "RESOLVED" || current === "REJECTED" ? "COMPLAINT_REOPENED_OR_CORRECTED" : "COMPLAINT_STATUS_UPDATED",
    entityType: "Complaint",
    entityId: id,
    before: { status: current, approvedAdjustmentSar: complaint.approvedAdjustmentSar, resolutionNote: complaint.resolutionNote },
    after: { status: next, approvedAdjustmentSar: updated.approvedAdjustmentSar, resolutionNote: updated.resolutionNote },
  });
  await notify({
    userId: complaint.reporterUserId,
    type: "ORDER_COMPLAINT_UPDATED",
    title: next === "RESOLVED" ? "تمت معالجة الشكوى" : next === "REJECTED" ? "تم إغلاق الشكوى" : "تحديث على الشكوى",
    body: `تم تحديث حالة الشكوى الخاصة بالطلب ${complaint.order.code}. راجع تفاصيلها في التطبيق.`,
    meta: { orderId: complaint.orderId, complaintId: id, status: next },
  });
  return NextResponse.json({ ok: true, complaint: updated, note: "أي مبلغ مسجل هنا توثيق للتسوية فقط ولا ينفذ دفعاً." });
}
