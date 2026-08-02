import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function RepDashboardPage() {
  const t = await getTranslations("Dashboard");
  const tCommon = await getTranslations("Common");
  const user = await getCurrentUser();

  const referralLink = user?.salesRep ? `/?ref=${user.salesRep.referralCode}` : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-extrabold text-ink-900">{t("repTitle")}</h1>
      <p className="mt-1 text-ink-600">{user?.name}</p>

      {user?.status === "PENDING_APPROVAL" && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-brand-800">
          {t("repPending")}
        </div>
      )}

      {user?.salesRep && (
        <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-ink-800">{t("repReferralLabel")}</p>
          <p dir="ltr" className="mt-2 break-all font-mono text-sm text-brand-700">
            {referralLink}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {t("repReferralLabel")}: {user.salesRep.referralCode}
          </p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-dashed border-ink-200 p-8 text-center text-ink-500">
        {tCommon("comingSoon")}
      </div>
    </div>
  );
}
