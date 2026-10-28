"use client";

import { useEffect, useState } from "react";

type CompanyPerformance = {
  id: string;
  name: string;
  quotesSent: number;
  acceptedOrders: number;
  completedOrders: number;
  conversionRate: number;
  completionRate: number;
  acceptedValue: number;
  ratingAvg: number;
  ratingCount: number;
};

type RepPerformance = {
  id: string;
  name: string;
  referralCode: string;
  referredOrders: number;
  acceptedOrders: number;
  conversionRate: number;
  pendingCommission: number;
  confirmedCommission: number;
  paidCommission: number;
};

type PerformanceResponse = {
  ok: boolean;
  companyPerformance: CompanyPerformance[];
  repPerformance: RepPerformance[];
};

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 0,
});

function Percent({ value }: { value: number }) {
  const color = value >= 70 ? "text-emerald-700" : value >= 40 ? "text-amber-700" : "text-red-700";
  return <span className={`font-bold ${color}`}>{value.toLocaleString("ar-SA")}%</span>;
}

export function PerformanceScorecards() {
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/performance", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("تعذر تحميل تقييم الأداء");
        setData((await response.json()) as PerformanceResponse);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }
  if (!data) {
    return <div className="rounded-2xl border border-ink-100 bg-white p-6 text-ink-500">جاري حساب مؤشرات الأداء…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <div className="border-b border-ink-100 p-5">
          <h3 className="font-extrabold text-ink-900">أداء شركات الخرسانة</h3>
          <p className="mt-1 text-sm text-ink-500">المؤشرات محسوبة تلقائياً من العروض والطلبات المكتملة والتقييمات.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-ink-50 text-ink-600">
              <tr>
                <th className="p-3 text-start">الشركة</th>
                <th className="p-3 text-start">العروض</th>
                <th className="p-3 text-start">المقبولة</th>
                <th className="p-3 text-start">نسبة القبول</th>
                <th className="p-3 text-start">نسبة الإكمال</th>
                <th className="p-3 text-start">قيمة الأعمال</th>
                <th className="p-3 text-start">التقييم</th>
              </tr>
            </thead>
            <tbody>
              {data.companyPerformance.map((company) => (
                <tr key={company.id} className="border-t border-ink-100">
                  <td className="p-3 font-bold text-ink-900">{company.name}</td>
                  <td className="p-3">{company.quotesSent}</td>
                  <td className="p-3">{company.acceptedOrders}</td>
                  <td className="p-3"><Percent value={company.conversionRate} /></td>
                  <td className="p-3"><Percent value={company.completionRate} /></td>
                  <td className="p-3 font-bold">{money.format(company.acceptedValue)}</td>
                  <td className="p-3">{company.ratingAvg.toFixed(1)} / 5 <span className="text-ink-400">({company.ratingCount})</span></td>
                </tr>
              ))}
              {data.companyPerformance.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-ink-500">لا توجد شركات معتمدة حتى الآن.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <div className="border-b border-ink-100 p-5">
          <h3 className="font-extrabold text-ink-900">أداء مناديب المبيعات</h3>
          <p className="mt-1 text-sm text-ink-500">الإحالات المقبولة والعمولات حسب حالتها المالية.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-ink-50 text-ink-600">
              <tr>
                <th className="p-3 text-start">المندوب</th>
                <th className="p-3 text-start">الإحالات</th>
                <th className="p-3 text-start">المقبولة</th>
                <th className="p-3 text-start">التحويل</th>
                <th className="p-3 text-start">معلّقة</th>
                <th className="p-3 text-start">مؤكدة</th>
                <th className="p-3 text-start">مدفوعة</th>
              </tr>
            </thead>
            <tbody>
              {data.repPerformance.map((rep) => (
                <tr key={rep.id} className="border-t border-ink-100">
                  <td className="p-3">
                    <p className="font-bold text-ink-900">{rep.name}</p>
                    <p className="text-xs text-ink-400">{rep.referralCode}</p>
                  </td>
                  <td className="p-3">{rep.referredOrders}</td>
                  <td className="p-3">{rep.acceptedOrders}</td>
                  <td className="p-3"><Percent value={rep.conversionRate} /></td>
                  <td className="p-3">{money.format(rep.pendingCommission)}</td>
                  <td className="p-3">{money.format(rep.confirmedCommission)}</td>
                  <td className="p-3 font-bold">{money.format(rep.paidCommission)}</td>
                </tr>
              ))}
              {data.repPerformance.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-ink-500">لا يوجد مندوبون معتمدون حتى الآن.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
