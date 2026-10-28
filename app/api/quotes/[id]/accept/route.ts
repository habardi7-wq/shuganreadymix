import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";
import { formatPhoneForDisplay } from "@/lib/phone";
import { computeCommission } from "@/lib/commission";
import type { CommissionType } from "@/lib/enums";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireRole("CUSTOMER");
  if (!user) return response;

  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      order: { include: { customer: true } },
      company: { include: { user: true } },
    },
  });

  if (!quote || quote.order.customerId !== user.id) {
    return NextResponse.json({ ok: false, error: "العرض غير موجود" }, { status: 404 });
  }
  if (quote.status !== "PENDING") {
    return NextResponse.json({ ok: false, error: "هذا العرض لم يعد متاحًا" }, { status: 409 });
  }
  if (quote.order.status === "ACCEPTED" || quote.order.status === "COMPLETED") {
    return NextResponse.json(
      { ok: false, error: "تم قبول عرض آخر على هذا الطلب مسبقًا" },
      { status: 409 }
    );
  }

  const beforeOrderStatus = quote.order.status;

  await prisma.$transaction([
    prisma.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED" } }),
    prisma.order.update({
      where: { id: quote.order.id },
      data: { status: "ACCEPTED", acceptedQuoteId: quote.id },
    }),
    prisma.quote.updateMany({
      where: { orderId: quote.order.id, id: { not: quote.id }, status: "PENDING" },
      data: { status: "REJECTED" },
    }),
  ]);

  await logAudit({
    actorUserId: user.id,
    action: "ORDER_ACCEPTED_QUOTE",
    entityType: "Order",
    entityId: quote.order.id,
    before: { status: beforeOrderStatus },
    after: { status: "ACCEPTED", acceptedQuoteId: quote.id },
  });

  const commissionSetting =
    (await prisma.commissionSetting.findFirst({
      where: { scope: "COMPANY", companyId: quote.companyId, isActive: true },
    })) ??
    (await prisma.commissionSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    }));

  if (commissionSetting) {
    const amount = computeCommission(
      commissionSetting.type as CommissionType,
      commissionSetting.value,
      quote.order.quantityM3,
      quote.totalPrice
    );
    await prisma.commission.create({
      data: {
        orderId: quote.order.id,
        quoteId: quote.id,
        repId: quote.order.referredByRepId,
        type: commissionSetting.type,
        rate: commissionSetting.value,
        amount,
        status: "PENDING",
      },
    });
  }

  // First and only point where the customer's identity is shared with a
  // company — and only with the one whose quote was just accepted.
  await notify({
    userId: quote.company.user.id,
    type: "QUOTE_ACCEPTED",
    title: "تم قبول عرضك! بيانات التواصل مع العميل",
    body: `العميل: ${quote.order.customer.name ?? "غير محدد"} — الجوال: ${formatPhoneForDisplay(
      quote.order.customer.phone ?? ""
    )} — الطلب ${quote.order.code}.`,
    meta: { orderId: quote.order.id, quoteId: quote.id },
  });

  await notify({
    userId: quote.order.customerId,
    type: "ORDER_ACCEPTED",
    title: "تم تأكيد طلبك",
    body: `تم قبول عرض ${quote.company.name} لطلبك ${quote.order.code}. ستتواصل معك الشركة قريبًا.`,
    meta: { orderId: quote.order.id },
  });

  return NextResponse.json({ ok: true });
}
