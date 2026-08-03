import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

export async function GET() {
  const { user, response } = await requireRole("ADMIN");
  if (!user) return response;

  const reps = await prisma.salesRep.findMany({
    include: { user: { select: { phone: true, name: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, reps });
}
