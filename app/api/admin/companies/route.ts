import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

export async function GET() {
  const { user, response } = await requireRole("ADMIN");
  if (!user) return response;

  const companies = await prisma.company.findMany({
    include: {
      user: { select: { phone: true, name: true, createdAt: true } },
      serviceAreas: { include: { city: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, companies });
}
