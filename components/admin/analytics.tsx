"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface AnalyticsData {
  ordersByStatus: { status: string; count: number }[];
  ordersByCity: { city: string; count: number; quantityM3: number }[];
  acceptedOrdersCount: number;
  totalRevenue: number;
  avgPricePerM3: number;
  totalQuantityM3: number;
  commissionsByStatus: { status: string; amount: number; count: number }[];
}

export function AdminAnalytics() {
  const t = useTranslations("Admin");
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => d.ok && setData(d));
  }, []);

  if (!data) {
    return <p className="text-sm text-ink-400">…</p>;
  }

  const totalCommissions = data.commissionsByStatus.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t("totalRevenue")} value={`${data.totalRevenue.toLocaleString()} ر.س`} />
        <Stat label={t("totalCommissions")} value={`${totalCommissions.toLocaleString()} ر.س`} />
        <Stat label={t("avgPricePerM3")} value={`${data.avgPricePerM3.toFixed(0)} ر.س`} />
        <Stat label={t("totalQuantity")} value={`${data.totalQuantityM3.toLocaleString()} m³`} />
      </div>

      <div>
        <h3 className="font-bold text-ink-900">{t("ordersByStatus")}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.ordersByStatus.map((r) => (
            <span
              key={r.status}
              className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700"
            >
              {r.status}: {r.count}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-ink-900">{t("ordersByCity")}</h3>
        <div className="mt-2 flex flex-col gap-2">
          {data.ordersByCity.map((r) => (
            <div
              key={r.city}
              className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm"
            >
              <span className="font-semibold text-ink-800">{r.city}</span>
              <span className="text-ink-500">
                {r.count} {t("ordersUnit")} · {r.quantityM3.toLocaleString()} m³
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-ink-900">{t("commissionsByStatus")}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.commissionsByStatus.map((r) => (
            <span
              key={r.status}
              className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
            >
              {r.status}: {r.amount.toLocaleString()} ر.س ({r.count})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
      <p className="text-lg font-black text-ink-900">{value}</p>
      <p className="mt-1 text-xs text-ink-500">{label}</p>
    </div>
  );
}
