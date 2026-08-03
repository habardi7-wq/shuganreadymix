import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { createOrderSchema } from "@/lib/validation/order";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";
import { REFERRAL_COOKIE } from "@/lib/referral";

function generateOrderCode(): string {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KP-${datePart}-${rand}`;
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireRole("CUSTOMER");
  if (!user) return response;

  if (user.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "الحساب غير مفعّل" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "بيانات غير صالحة", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const city = await prisma.city.findUnique({ where: { id: data.cityId } });
  if (!city) {
    return NextResponse.json({ ok: false, error: "مدينة غير صالحة" }, { status: 400 });
  }

  if (data.districtId) {
    const district = await prisma.district.findFirst({
      where: { id: data.districtId, cityId: data.cityId },
    });
    if (!district) {
      return NextResponse.json({ ok: false, error: "حي غير صالح" }, { status: 400 });
    }
  }

  const scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}:00`);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() - 60_000) {
    return NextResponse.json(
      { ok: false, error: "موعد الصب يجب أن يكون في المستقبل" },
      { status: 400 }
    );
  }

  const refCode = req.cookies.get(REFERRAL_COOKIE)?.value;
  const referringRep = refCode
    ? await prisma.salesRep.findFirst({
        where: { referralCode: refCode, status: "APPROVED" },
        select: { id: true },
      })
    : null;

  const order = await prisma.order.create({
    data: {
      code: generateOrderCode(),
      customerId: user.id,
      cityId: data.cityId,
      districtId: data.districtId ?? null,
      locationDetails: data.locationDetails ?? null,
      projectType: data.projectType,
      concreteType: data.concreteType,
      strengthGrade: data.strengthGrade,
      quantityM3: data.quantityM3,
      pumpRequired: data.pumpRequired,
      pumpType: data.pumpRequired ? data.pumpType : null,
      scheduledAt,
      notes: data.notes ?? null,
      referredByRepId: referringRep?.id ?? null,
    },
    include: { city: true, district: true },
  });

  await logAudit({
    actorUserId: user.id,
    action: "ORDER_CREATED",
    entityType: "Order",
    entityId: order.id,
    after: { code: order.code, cityId: order.cityId, quantityM3: order.quantityM3 },
  });

  await notify({
    userId: user.id,
    type: "ORDER_CREATED",
    title: "تم إرسال طلبك",
    body: `تم استلام طلبك رقم ${order.code}، بانتظار عروض الأسعار.`,
  });

  // Match approved companies serving this city/district and notify them.
  // Customer identity is intentionally NOT included in this notification —
  // companies only see order specs until a quote is accepted (see privacy
  // requirements in README).
  const matchingAreas = await prisma.companyServiceArea.findMany({
    where: {
      cityId: order.cityId,
      OR: [{ districtId: null }, { districtId: order.districtId }],
      company: { status: "APPROVED" },
    },
    select: { company: { select: { userId: true, id: true } } },
    distinct: ["companyId"],
  });

  await Promise.all(
    matchingAreas.map((area) =>
      notify({
        userId: area.company.userId,
        type: "NEW_ORDER_MATCH",
        title: "طلب خرسانة جديد في منطقتك",
        body: `طلب رقم ${order.code} — ${order.quantityM3} م³ في ${city.name}. أرسل عرض سعرك.`,
        meta: { orderId: order.id },
      })
    )
  );

  return NextResponse.json({ ok: true, order });
}

export async function GET() {
  const { user, response } = await requireRole("CUSTOMER");
  if (!user) return response;

  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    include: { city: true, district: true, quotes: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, orders });
}
