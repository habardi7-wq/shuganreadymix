import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { AdminApprovals } from "@/components/admin/approvals";
import { CommissionSettings } from "@/components/admin/commission-settings";
import { AdminAnalytics } from "@/components/admin/analytics";

export default async function AdminDashboardPage() {
  const t = await getTranslations("Dashboard");
  const tAdmin = await getTranslations("Admin");
  const user = await getCurrentUser();

  const [customers, companies, reps, orders, pendingCompanies, pendingReps] =
    await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "COMPANY" } }),
      prisma.user.count({ where: { role: "SALES_REP" } }),
      prisma.order.count(),
      prisma.company.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.salesRep.count({ where: { status: "PENDING" } }),
    ]);

  const stats = [
    { label: "العملاء", value: customers },
    { label: "الشركات", value: companies },
    { label: "المندوبون", value: reps },
    { label: "الطلبات", value: orders },
    { label: "شركات بانتظار الاعتماد", value: pendingCompanies },
    { label: "مندوبون بانتظار الاعتماد", value: pendingReps },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-extrabold text-ink-900">{t("adminTitle")}</h1>
      <p className="mt-1 text-ink-600">
        {t("adminWelcome")} — {user?.name}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <p className="text-3xl font-black text-ink-900">{s.value}</p>
            <p className="mt-1 text-sm text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-extrabold text-ink-900">{tAdmin("approvalsTitle")}</h2>
        <div className="mt-4">
          <AdminApprovals />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-extrabold text-ink-900">{tAdmin("commissionsTitle")}</h2>
        <p className="mt-1 text-sm text-ink-500">{tAdmin("commissionsSubtitle")}</p>
        <div className="mt-4">
          <CommissionSettings />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-extrabold text-ink-900">{tAdmin("analyticsTitle")}</h2>
        <div className="mt-4">
          <AdminAnalytics />
        </div>
      </div>
    </div>
  );
}
