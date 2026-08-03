import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink-900">{value}</p>
    </div>
  );
}

export default async function RepDashboardPage() {
  const t = await getTranslations("Dashboard");
  const tRep = await getTranslations("Rep");
  const user = await getCurrentUser();

  const referralLink = user?.salesRep ? `/?ref=${user.salesRep.referralCode}` : null;

  const referredOrders =
    user?.salesRep && user.salesRep.status === "APPROVED"
      ? await prisma.order.findMany({
          where: { referredByRepId: user.salesRep.id },
          include: {
            city: true,
            commissions: true,
            acceptedQuote: { include: { company: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const commissionTotals = { PENDING: 0, CONFIRMED: 0, PAID: 0 } as Record<
    "PENDING" | "CONFIRMED" | "PAID",
    number
  >;
  for (const order of referredOrders) {
    for (const commission of order.commissions) {
      commissionTotals[commission.status as "PENDING" | "CONFIRMED" | "PAID"] +=
        commission.amount;
    }
  }

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

      {user?.salesRep && user.salesRep.status === "APPROVED" && (
        <>
          <h2 className="mt-8 text-lg font-bold text-ink-900">{tRep("earningsTitle")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label={tRep("statTotalOrders")} value={String(referredOrders.length)} />
            <Stat
              label={tRep("statPending")}
              value={`${commissionTotals.PENDING.toLocaleString()} ${tRep("riyal")}`}
            />
            <Stat
              label={tRep("statConfirmed")}
              value={`${commissionTotals.CONFIRMED.toLocaleString()} ${tRep("riyal")}`}
            />
            <Stat
              label={tRep("statPaid")}
              value={`${commissionTotals.PAID.toLocaleString()} ${tRep("riyal")}`}
            />
          </div>

          <h3 className="mt-8 text-base font-bold text-ink-900">{tRep("ordersListTitle")}</h3>
          {referredOrders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-ink-200 p-8 text-center text-ink-500">
              {tRep("noOrders")}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {referredOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-sm font-bold text-ink-900">{order.code}</p>
                    <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-bold text-ink-700">
                      {tRep("orderStatusLabel")}: {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {order.city.name} — {order.quantityM3} م³
                    {order.acceptedQuote ? ` — ${order.acceptedQuote.company.name}` : ""}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-800">
                    {tRep("commissionAmount")}:{" "}
                    {order.commissions.length > 0 ? (
                      order.commissions.map((c) => (
                        <span key={c.id} className="me-3">
                          {c.amount.toLocaleString()} {tRep("riyal")} (
                          {tRep(`commissionStatus${c.status}` as never)})
                        </span>
                      ))
                    ) : (
                      <span className="text-ink-400">{tRep("noCommissionYet")}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
