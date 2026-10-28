import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { createRatingSchema } from "@/lib/validation/rating";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireRole("CUSTOMER");
  if (!user) return response;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { acceptedQuote: true, ratings: true },
  });

  if (!order || order.customerId !== user.id) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }
  if (order.status !== "COMPLETED" || !order.acceptedQuote) {
    return NextResponse.json(
      { ok: false, error: "لا يمكن التقييم قبل اكتمال الطلب" },
      { status: 409 }
    );
  }
  if (order.ratings.length > 0) {
    return NextResponse.json({ ok: false, error: "تم تقييم هذا الطلب مسبقًا" }, { status: 409 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createRatingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
  }
  const { stars, comment } = parsed.data;
  const companyId = order.acceptedQuote.companyId;

  const rating = await prisma.rating.create({
    data: { orderId: order.id, companyId, customerId: user.id, stars, comment: comment ?? null },
  });

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (company) {
    const newCount = company.ratingCount + 1;
    const newAvg = (company.ratingAvg * company.ratingCount + stars) / newCount;
    await prisma.company.update({
      where: { id: companyId },
      data: { ratingAvg: newAvg, ratingCount: newCount },
    });

    await notify({
      userId: company.userId,
      type: "NEW_RATING",
      title: "تقييم جديد لشركتك",
      body: `تلقّيت تقييمًا بـ ${stars} نجوم على الطلب ${order.code}.`,
    });
  }

  await logAudit({
    actorUserId: user.id,
    action: "ORDER_RATED",
    entityType: "Rating",
    entityId: rating.id,
    after: { orderId: order.id, companyId, stars },
  });

  return NextResponse.json({ ok: true, rating });
}
