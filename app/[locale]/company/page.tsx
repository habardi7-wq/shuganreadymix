import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { MatchingOrders } from "@/components/company/matching-orders";

export default async function CompanyDashboardPage() {
  const t = await getTranslations("Dashboard");
  const tCompany = await getTranslations("Company");
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-extrabold text-ink-900">{t("companyTitle")}</h1>
      <p className="mt-1 text-ink-600">{user?.name}</p>

      {user?.status === "PENDING_APPROVAL" && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-brand-800">
          {t("companyPending")}
        </div>
      )}

      {user?.status === "ACTIVE" && user.company?.status === "APPROVED" && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-ink-900">{tCompany("matchingOrdersTitle")}</h2>
          <p className="mt-1 text-sm text-ink-500">{tCompany("matchingOrdersSubtitle")}</p>
          <div className="mt-4">
            <MatchingOrders />
          </div>
        </div>
      )}

      {user?.status === "ACTIVE" && user.company?.status !== "APPROVED" && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-brand-800">
          {t("companyPending")}
        </div>
      )}
    </div>
  );
}
