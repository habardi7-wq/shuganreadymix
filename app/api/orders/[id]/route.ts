import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireRole("CUSTOMER");
  if (!user) return response;

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      city: true,
      district: true,
      quotes: {
        orderBy: { totalPrice: "asc" },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              logoUrl: true,
              ratingAvg: true,
              ratingCount: true,
              brandColorHex: true,
            },
          },
        },
      },
    },
  });

  if (!order || order.customerId !== user.id) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order });
}
