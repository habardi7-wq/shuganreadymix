import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { createQuoteSchema } from "@/lib/validation/quote";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";

export async function POST(req: NextRequest) {
  const { user, response } = await requireRole("COMPANY");
  if (!user) return response;

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company || company.status !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "حسابك غير معتمد بعد" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createQuoteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "بيانات غير صالحة", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: data.orderId } });
  if (!order) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }
  if (order.status !== "NEW" && order.status !== "QUOTED") {
    return NextResponse.json(
      { ok: false, error: "لم يعد هذا الطلب متاحًا لإرسال عروض" },
      { status: 409 }
    );
  }

  const servesArea = await prisma.companyServiceArea.findFirst({
    where: {
      companyId: company.id,
      cityId: order.cityId,
      OR: [{ districtId: null }, { districtId: order.districtId }],
    },
  });
  if (!servesArea) {
    return NextResponse.json(
      { ok: false, error: "هذا الطلب خارج نطاق تغطيتك" },
      { status: 403 }
    );
  }

  const totalPrice = data.pricePerM3 * order.quantityM3 + (data.pumpPrice ?? 0);

  const existing = await prisma.quote.findFirst({
    where: { orderId: order.id, companyId: company.id, status: "PENDING" },
  });

  const quote = existing
    ? await prisma.quote.update({
        where: { id: existing.id },
        data: {
          pricePerM3: data.pricePerM3,
          pumpPrice: data.pumpPrice ?? null,
          totalPrice,
          notes: data.notes ?? null,
        },
      })
    : await prisma.quote.create({
        data: {
          orderId: order.id,
          companyId: company.id,
          pricePerM3: data.pricePerM3,
          pumpPrice: data.pumpPrice ?? null,
          totalPrice,
          notes: data.notes ?? null,
        },
      });

  if (order.status === "NEW") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "QUOTED" } });
  }

  await logAudit({
    actorUserId: user.id,
    action: existing ? "QUOTE_UPDATED" : "QUOTE_CREATED",
    entityType: "Quote",
    entityId: quote.id,
    after: { orderId: order.id, companyId: company.id, totalPrice },
  });

  await notify({
    userId: order.customerId,
    type: "QUOTE_RECEIVED",
    title: "عرض سعر جديد على طلبك",
    body: `أرسلت ${company.name} عرض سعر لطلبك ${order.code}.`,
    meta: { orderId: order.id, quoteId: quote.id },
  });

  return NextResponse.json({ ok: true, quote });
}
