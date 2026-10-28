import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAdminPermission("APPROVALS_MANAGE");
  if (!user) return response;

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ ok: false, error: "الشركة غير موجودة" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.company.update({ where: { id }, data: { status: "APPROVED" } }),
    prisma.user.update({ where: { id: company.userId }, data: { status: "ACTIVE" } }),
  ]);

  await logAudit({
    actorUserId: user.id,
    action: "COMPANY_APPROVED",
    entityType: "Company",
    entityId: id,
    before: { status: company.status },
    after: { status: "APPROVED" },
  });

  await notify({
    userId: company.userId,
    type: "COMPANY_APPROVED",
    title: "تم اعتماد شركتك",
    body: "تهانينا! تم اعتماد حسابك، ويمكنك الآن استقبال الطلبات المطابقة وإرسال عروض الأسعار.",
  });

  return NextResponse.json({ ok: true });
}
