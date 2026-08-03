import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { companyOnboardingSchema } from "@/lib/validation/company";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slugify";

export async function POST(req: NextRequest) {
  const { user, response } = await requireRole("COMPANY");
  if (!user) return response;

  const existing = await prisma.company.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "لديك ملف شركة مُنشأ مسبقًا" },
      { status: 409 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = companyOnboardingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "بيانات غير صالحة", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const cities = await prisma.city.findMany({ where: { id: { in: data.cityIds } } });
  if (cities.length !== data.cityIds.length) {
    return NextResponse.json({ ok: false, error: "مدينة غير صالحة" }, { status: 400 });
  }

  const slug = slugify(data.name, user.id.slice(-6));
  const crDocUrl = `data:${data.crDocument.mimeType};base64,${data.crDocument.dataBase64}`;

  const company = await prisma.company.create({
    data: {
      userId: user.id,
      name: data.name,
      nameEn: data.nameEn || null,
      slug,
      crNumber: data.crNumber,
      crDocUrl,
      status: "PENDING_REVIEW",
      serviceAreas: {
        create: data.cityIds.map((cityId) => ({ cityId, districtId: null })),
      },
    },
  });

  await logAudit({
    actorUserId: user.id,
    action: "COMPANY_ONBOARDED",
    entityType: "Company",
    entityId: company.id,
    after: { name: company.name, crNumber: company.crNumber, cityIds: data.cityIds },
  });

  return NextResponse.json({ ok: true, company });
}
