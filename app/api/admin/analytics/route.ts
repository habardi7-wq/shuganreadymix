import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";

export async function GET() {
  const { user, response } = await requireAdminPermission("ANALYTICS_VIEW");
  if (!user || !response) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 403 });

  const [ordersByStatus, ordersByCity, acceptedQuotes, commissionsByStatus, totalQuantity, cities] =
    await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.groupBy({ by: ["cityId"], _count: { _all: true }, _sum: { quantityM3: true } }),
      prisma.quote.findMany({
        where: { status: "ACCEPTED" },
        select: { pricePerM3: true, totalPrice: true },
      }),
      prisma.commission.groupBy({ by: ["status"], _sum: { amount: true }, _count: { _all: true } }),
      prisma.order.aggregate({ _sum: { quantityM3: true } }),
      prisma.city.findMany({ select: { id: true, name: true } }),
    ]);

  const cityNameById = new Map(cities.map((c) => [c.id, c.name]));

  const totalRevenue = acceptedQuotes.reduce((sum, q) => sum + q.totalPrice, 0);
  const avgPricePerM3 =
    acceptedQuotes.length > 0
      ? acceptedQuotes.reduce((sum, q) => sum + q.pricePerM3, 0) / acceptedQuotes.length
      : 0;

  return NextResponse.json({
    ok: true,
    ordersByStatus: ordersByStatus.map((r) => ({ status: r.status, count: r._count._all })),
    ordersByCity: ordersByCity.map((r) => ({
      city: cityNameById.get(r.cityId) ?? r.cityId,
      count: r._count._all,
      quantityM3: r._sum.quantityM3 ?? 0,
    })),
    acceptedOrdersCount: acceptedQuotes.length,
    totalRevenue,
    avgPricePerM3,
    totalQuantityM3: totalQuantity._sum.quantityM3 ?? 0,
    commissionsByStatus: commissionsByStatus.map((r) => ({
      status: r.status,
      amount: r._sum.amount ?? 0,
      count: r._count._all,
    })),
  });
}
