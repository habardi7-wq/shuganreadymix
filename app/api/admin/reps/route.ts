import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";

export async function GET() {
  const { user, response } = await requireAdminPermission("APPROVALS_MANAGE");
  if (!user) return response;

  const reps = await prisma.salesRep.findMany({
    include: { user: { select: { phone: true, name: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, reps });
}
