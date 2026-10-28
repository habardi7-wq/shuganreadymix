import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

export async function GET() {
  const { user, response } = await requireRole("ADMIN");
  if (!user) return response;

  const commissions = await prisma.commission.findMany({
    include: {
      order: { select: { code: true, quantityM3: true } },
      quote: {
        select: {
          totalPrice: true,
          company: { select: { name: true } },
        },
      },
      rep: {
        select: {
          referralCode: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totals = commissions.reduce(
    (acc, item) => {
      const status = item.status as "PENDING" | "CONFIRMED" | "PAID";
      if (status in acc) acc[status] += item.amount;
      return acc;
    },
    { PENDING: 0, CONFIRMED: 0, PAID: 0 }
  );

  return NextResponse.json({ ok: true, totals, commissions });
}
