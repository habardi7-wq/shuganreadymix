"use client";

import { useCallback, useEffect, useState } from "react";

type Commission = {
  id: string;
  amount: number;
  type: string;
  rate: number;
  status: "PENDING" | "CONFIRMED" | "PAID";
  createdAt: string;
  order: { code: string; quantityM3: number };
  quote: { totalPrice: number; company: { name: string } };
  rep: { referralCode: string; user: { name: string | null } } | null;
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor: { name: string | null; role: string } | null;
};

type FinanceResponse = {
  ok: boolean;
  totals: { PENDING: number; CONFIRMED: number; PAID: number };
  commissions: Commission[];
};

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 2,
});

const statusLabel = {
  PENDING: "معلّقة",
  CONFIRMED: "مؤكدة",
  PAID: "مدفوعة",
} as const;

const actionLabel: Record<string, string> = {
  ORDER_CREATED: "إنشاء طلب",
  QUOTE_CREATED: "إرسال عرض",
  QUOTE_UPDATED: "تعديل عرض",
  ORDER_ACCEPTED_QUOTE: "قبول عرض",
  ORDER_COMPLETED: "إكمال طلب",
  ORDER_RATED: "تقييم طلب",
  COMPANY_APPROVED: "اعتماد شركة",
  COMPANY_REJECTED: "رفض شركة",
  REP_APPROVED: "اعتماد مندوب",
  REP_REJECTED: "رفض مندوب",
  COMMISSION_SETTING_CREATED: "إنشاء إعداد عمولة",
  COMMISSION_SETTING_UPDATED: "تعديل إعداد عمولة",
  COMMISSION_CONFIRMED: "تأكيد عمولة",
  COMMISSION_PAID: "تسجيل دفع عمولة",
};

export function FinanceAccountability() {
  const [finance, setFinance] = useState<FinanceResponse | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [financeRes, auditRes] = await Promise.all([
        fetch("/api/admin/commissions", { cache: "no-store" }),
        fetch("/api/admin/audit-logs?limit=50", { cache: "no-store" }),
      ]);
      if (!financeRes.ok || !auditRes.ok) throw new Error("تعذر تحميل بيانات المحاسبة");
      const financeJson = (await financeRes.json()) as FinanceResponse;
      const auditJson = (await auditRes.json()) as { ok: boolean; logs: AuditLog[] };
      setFinance(financeJson);
      setLogs(auditJson.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function advance(item: Commission) {
    const next = item.status === "PENDING" ? "CONFIRMED" : item.status === "CONFIRMED" ? "PAID" : null;
    if (!next) return;

    const prompt =
      next === "CONFIRMED"
        ? `تأكيد استحقاق عمولة الطلب ${item.order.code} بقيمة ${money.format(item.amount)}؟`
        : `تسجيل عمولة الطلب ${item.order.code} كمدفوعة بقيمة ${money.format(item.amount)}؟`;
    if (!window.confirm(prompt)) return;

    setBusyId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/commissions/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "تعذر تحديث العمولة");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setBusyId(null);
    }
  }

  if (!finance && !error) {
    return <div className="rounded-2xl border border-ink-100 bg-white p-6 text-ink-500">جاري تحميل السجلات المالية…</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button className="ms-3 font-bold underline" onClick={() => void load()}>إعادة المحاولة</button>
        </div>
      )}

      {finance && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {([
              ["PENDING", "عمولات معلّقة"],
              ["CONFIRMED", "عمولات مؤكدة"],
              ["PAID", "عمولات مدفوعة"],
            ] as const).map(([status, label]) => (
              <div key={status} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-ink-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-ink-900">{money.format(finance.totals[status])}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
            <div className="border-b border-ink-100 p-5">
              <h3 className="font-extrabold text-ink-900">سجل العمولات والتسويات</h3>
              <p className="mt-1 text-sm text-ink-500">كل تأكيد أو دفع يُسجل باسم المستخدم ووقته في سجل التدقيق.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-ink-50 text-ink-600">
                  <tr>
                    <th className="p-3 text-start">الطلب</th>
                    <th className="p-3 text-start">الشركة</th>
                    <th className="p-3 text-start">قيمة الطلب</th>
                    <th className="p-3 text-start">العمولة</th>
                    <th className="p-3 text-start">الحالة</th>
                    <th className="p-3 text-start">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {finance.commissions.map((item) => (
                    <tr key={item.id} className="border-t border-ink-100">
                      <td className="p-3 font-bold text-ink-900">{item.order.code}</td>
                      <td className="p-3 text-ink-700">{item.quote.company.name}</td>
                      <td className="p-3 text-ink-700">{money.format(item.quote.totalPrice)}</td>
                      <td className="p-3 font-bold text-ink-900">{money.format(item.amount)}</td>
                      <td className="p-3"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{statusLabel[item.status]}</span></td>
                      <td className="p-3">
                        {item.status !== "PAID" ? (
                          <button
                            onClick={() => void advance(item)}
                            disabled={busyId === item.id}
                            className="rounded-lg bg-ink-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {busyId === item.id ? "جاري الحفظ…" : item.status === "PENDING" ? "تأكيد الاستحقاق" : "تسجيل كمدفوعة"}
                          </button>
                        ) : <span className="text-xs text-ink-400">مكتملة</span>}
                      </td>
                    </tr>
                  ))}
                  {finance.commissions.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-ink-500">لا توجد عمولات مسجلة بعد.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <div className="border-b border-ink-100 p-5">
          <h3 className="font-extrabold text-ink-900">آخر العمليات المسجلة</h3>
          <p className="mt-1 text-sm text-ink-500">مسار مراجعة يوضح من نفّذ كل عملية ومتى.</p>
        </div>
        <div className="divide-y divide-ink-100">
          {logs.map((log) => (
            <div key={log.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-ink-900">{actionLabel[log.action] ?? log.action}</p>
                <p className="text-xs text-ink-500">{log.entityType}{log.entityId ? ` · ${log.entityId}` : ""}</p>
              </div>
              <div className="text-xs text-ink-500 sm:text-end">
                <p>{log.actor?.name ?? "النظام"}{log.actor?.role ? ` · ${log.actor.role}` : ""}</p>
                <p>{new Date(log.createdAt).toLocaleString("ar-SA")}</p>
              </div>
            </div>
          ))}
          {logs.length === 0 && <p className="p-8 text-center text-sm text-ink-500">لا توجد عمليات مسجلة بعد.</p>}
        </div>
      </div>
    </div>
  );
}
