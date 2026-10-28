import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

export async function GET() {
  const { user, response } = await requireAdminPermission("ANALYTICS_VIEW");
  if (!user) return response;

  const [companies, reps] = await Promise.all([
    prisma.company.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        name: true,
        ratingAvg: true,
        ratingCount: true,
        quotes: {
          select: {
            status: true,
            totalPrice: true,
            order: { select: { status: true } },
          },
        },
      },
    }),
    prisma.salesRep.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        referralCode: true,
        user: { select: { name: true } },
        referredOrders: { select: { status: true } },
        commissions: { select: { amount: true, status: true } },
      },
    }),
  ]);

  const companyPerformance = companies
    .map((company) => {
      const quotesSent = company.quotes.length;
      const accepted = company.quotes.filter((quote) => quote.status === "ACCEPTED");
      const completed = accepted.filter((quote) => quote.order.status === "COMPLETED");
      return {
        id: company.id,
        name: company.name,
        quotesSent,
        acceptedOrders: accepted.length,
        completedOrders: completed.length,
        conversionRate: percentage(accepted.length, quotesSent),
        completionRate: percentage(completed.length, accepted.length),
        acceptedValue: accepted.reduce((sum, quote) => sum + quote.totalPrice, 0),
        ratingAvg: company.ratingAvg,
        ratingCount: company.ratingCount,
      };
    })
    .sort((a, b) => b.acceptedValue - a.acceptedValue);

  const repPerformance = reps
    .map((rep) => {
      const acceptedOrders = rep.referredOrders.filter((order) =>
        ["ACCEPTED", "COMPLETED"].includes(order.status)
      ).length;
      return {
        id: rep.id,
        name: rep.user.name ?? rep.referralCode,
        referralCode: rep.referralCode,
        referredOrders: rep.referredOrders.length,
        acceptedOrders,
        conversionRate: percentage(acceptedOrders, rep.referredOrders.length),
        pendingCommission: rep.commissions
          .filter((commission) => commission.status === "PENDING")
          .reduce((sum, commission) => sum + commission.amount, 0),
        confirmedCommission: rep.commissions
          .filter((commission) => commission.status === "CONFIRMED")
          .reduce((sum, commission) => sum + commission.amount, 0),
        paidCommission: rep.commissions
          .filter((commission) => commission.status === "PAID")
          .reduce((sum, commission) => sum + commission.amount, 0),
      };
    })
    .sort((a, b) => b.acceptedOrders - a.acceptedOrders);

  return NextResponse.json({ ok: true, companyPerformance, repPerformance });
}
