import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAdminPermission("AUDIT_VIEW");
  if (!user) return response ?? NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 403 });

  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitParam)
    ? Math.min(100, Math.max(10, Math.trunc(limitParam)))
    : 50;

  const logs = await prisma.auditLog.findMany({
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      beforeJson: true,
      afterJson: true,
      ip: true,
      createdAt: true,
      actor: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ ok: true, logs });
}
