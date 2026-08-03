import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

// Orders matching this company's service areas. Deliberately selects no
// customer fields at all — companies must never see who placed an order
// until they win it (see /api/quotes/[id]/accept).
export async function GET() {
  const { user, response } = await requireRole("COMPANY");
  if (!user) return response;

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company || company.status !== "APPROVED") {
    return NextResponse.json({ ok: true, orders: [] });
  }

  const areas = await prisma.companyServiceArea.findMany({
    where: { companyId: company.id },
  });
  if (areas.length === 0) {
    return NextResponse.json({ ok: true, orders: [] });
  }

  const orConditions = areas.map((a) =>
    a.districtId
      ? { cityId: a.cityId, districtId: a.districtId }
      : { cityId: a.cityId }
  );

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["NEW", "QUOTED"] },
      OR: orConditions,
    },
    select: {
      id: true,
      code: true,
      city: { select: { name: true, nameEn: true } },
      district: { select: { name: true, nameEn: true } },
      locationDetails: true,
      projectType: true,
      concreteType: true,
      strengthGrade: true,
      quantityM3: true,
      pumpRequired: true,
      pumpType: true,
      scheduledAt: true,
      notes: true,
      status: true,
      createdAt: true,
      quotes: {
        where: { companyId: company.id },
        select: { id: true, pricePerM3: true, pumpPrice: true, totalPrice: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = orders.map((o) => {
    const { quotes, ...rest } = o;
    return { ...rest, myQuote: quotes[0] ?? null };
  });

  return NextResponse.json({ ok: true, orders: result });
}
