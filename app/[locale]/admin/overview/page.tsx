import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SuperAdminOverview({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = locale === "en" ? "en" : "ar";
  const user = await getCurrentUser();
  if (!user) redirect(`/${safeLocale}/admin/login`);
  if (user.role !== "ADMIN" || user.adminLevel !== "SUPER_ADMIN" || user.status !== "ACTIVE") {
    return <main dir="rtl" className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-bold">غير مصرح بالوصول</h1><p>هذه الصفحة متاحة فقط للمالك المخول للمنصة.</p></main>;
  }
  // Read-only aggregated data. Do not fetch phone numbers, prices, CR documents or credentials.
  const [customers, companies, reps, orders, quotes, commissions, complaints, audit] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.company.count(),
    prisma.salesRep.count(),
    prisma.order.count(),
    prisma.quote.count(),
    prisma.commission.count(),
    prisma.complaint.count(),
    prisma.auditLog.count(),
  ]);
  const stats = [
    ["العملاء", customers], ["المصانع والشركات", companies],
    ["المندوبون", reps], ["طلبات الخرسانة", orders],
    ["عروض الأسعار", quotes], ["العمولات", commissions],
    ["الشكاوى", complaints], ["أحداث التدقيق", audit],
  ] as const;
  return <main dir="rtl" className="mx-auto max-w-6xl px-4 py-10 text-ink-900">
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
      <h1 className="text-2xl font-extrabold">لوحة مالك المنصة — مشاهدة فقط</h1>
      <p className="mt-2 text-sm">هذه لوحة فعلية للملخصات المجمعة بعد تسجيل دخول Super Admin. لا توجد أزرار تعديل أو اعتماد أو تصدير بيانات حساسة.</p>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map(([label, value]) => <article key={label} className="rounded-xl border border-ink-100 bg-white p-5">
        <p className="text-sm text-ink-500">{label}</p><p className="mt-2 text-3xl font-extrabold">{value.toLocaleString("ar-SA")}</p>
      </article>)}
    </div>
    <section className="mt-8 rounded-xl border border-ink-100 bg-white p-5">
      <h2 className="text-lg font-bold">ضوابط الخصوصية</h2>
      <p className="mt-2 text-sm leading-7 text-ink-600">هذه الصفحة لا تعرض بيانات تعريف العملاء ولا أسعار المصانع ولا تفاصيل الحسابات البنكية. صلاحية المالك تُفحص على الخادم في كل زيارة. الوصول إلى التفاصيل الحساسة يحتاج مراجعة سياسات وصلاحيات مستقلة.</p>
    </section>
    <section className="mt-6 rounded-xl border border-ink-100 bg-white p-5">
      <h2 className="text-lg font-bold">حالة وحدات المنصة</h2>
      <p className="mt-2 text-sm text-ink-600">الطلبات، الشركات، المندوبون، عروض الأسعار، العمولات، الشكاوى والتدقيق متاحة هنا كمؤشرات فعلية مجمعة. المخزون وحساب تكلفة التصنيع المتقدم غير موصولين بهذه الصفحة حتى الآن.</p>
    </section>
  </main>;
}
