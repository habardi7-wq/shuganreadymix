import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";

export async function GET() {
  const { user, response } = await requireAdminPermission("ORDERS_VIEW");
  if (!user) return response;
  const complaints = await prisma.complaint.findMany({
    include: {
      order: { select: { code: true, status: true, acceptedQuote: { select: { totalPrice: true } } } },
      deliveryLoad: { select: { sequence: true, truckNumber: true, plannedQuantityM3: true, receivedQuantityM3: true } },
      reporter: { select: { name: true, phone: true, role: true } },
      handler: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ ok: true, complaints });
}
