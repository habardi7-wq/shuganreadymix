import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireRole("ADMIN");
  if (!user) return response;

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ ok: false, error: "الشركة غير موجودة" }, { status: 404 });
  }

  await prisma.company.update({ where: { id }, data: { status: "REJECTED" } });

  await logAudit({
    actorUserId: user.id,
    action: "COMPANY_REJECTED",
    entityType: "Company",
    entityId: id,
    before: { status: company.status },
    after: { status: "REJECTED" },
  });

  await notify({
    userId: company.userId,
    type: "COMPANY_REJECTED",
    title: "تعذر اعتماد شركتك",
    body: "لم يتم اعتماد طلب انضمام شركتك حاليًا. تواصل مع الدعم لمزيد من التفاصيل.",
  });

  return NextResponse.json({ ok: true });
}
