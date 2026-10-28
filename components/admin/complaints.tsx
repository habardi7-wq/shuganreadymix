"use client";

import { useEffect, useState } from "react";

type CaseItem = {
  id: string;
  category: string;
  description: string;
  status: string;
  requestedAdjustmentSar: number | null;
  approvedAdjustmentSar: number | null;
  resolutionNote: string | null;
  createdAt: string;
  order: { code: string; acceptedQuote: { totalPrice: number } | null };
  reporter: { name: string | null; phone: string | null; role: string };
  deliveryLoad: { sequence: number; truckNumber: string | null; plannedQuantityM3: number; receivedQuantityM3: number | null } | null;
};
const statusNames: Record<string, string> = { OPEN: "جديدة", UNDER_REVIEW: "قيد المراجعة", RESOLVED: "تمت المعالجة", REJECTED: "مرفوضة" };
const categoryNames: Record<string, string> = { DELIVERY: "التوصيل", QUALITY: "الجودة", QUANTITY: "الكمية", BILLING: "الفاتورة", SERVICE: "الخدمة", OTHER: "أخرى" };

export function AdminComplaints({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/complaints", { cache: "no-store" });
    if (response.ok) setItems((await response.json()).complaints ?? []);
    else setError("تعذر تحميل الشكاوى. تحقق من صلاحية مشاهدة الطلبات.");
  }
  useEffect(() => { void refresh(); }, []);

  async function change(item: CaseItem, status: string) {
    if (!canManage) return;
    const reason = reasons[item.id]?.trim() ?? "";
    if (reason.length < 5) { setError("اكتب سبب المعالجة (5 أحرف على الأقل) لكل تحديث."); return; }
    setBusy(item.id);
    setError("");
    const rawAmount = amounts[item.id];
    const response = await fetch(`/api/admin/complaints/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, reason, ...(status === "RESOLVED" && rawAmount !== undefined && rawAmount !== "" ? { approvedAdjustmentSar: Number(rawAmount) } : {}) }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) { setError(data.error || "تعذر تحديث الشكوى"); return; }
    setReasons((current) => ({ ...current, [item.id]: "" }));
    await refresh();
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {items.length === 0 && <p className="rounded-2xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">لا توجد شكاوى مسجلة.</p>}
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-bold text-ink-900">طلب {item.order.code} · {categoryNames[item.category] ?? item.category}</p><p className="mt-1 text-xs text-ink-500">مقدم الشكوى: {item.reporter.name || item.reporter.role}{item.reporter.phone ? ` · ${item.reporter.phone}` : ""}</p></div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{statusNames[item.status] ?? item.status}</span>
          </div>
          {item.deliveryLoad && <p className="mt-3 text-sm text-ink-500">الشاحنة {item.deliveryLoad.sequence}{item.deliveryLoad.truckNumber ? ` · ${item.deliveryLoad.truckNumber}` : ""} — مخطط {item.deliveryLoad.plannedQuantityM3} م³، مستلم {item.deliveryLoad.receivedQuantityM3 ?? "غير محدد"} م³</p>}
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-700">{item.description}</p>
          {item.requestedAdjustmentSar != null && <p className="mt-2 text-sm">المبلغ المطلوب: <b>{item.requestedAdjustmentSar.toLocaleString("ar-SA")} ر.س</b></p>}
          {item.resolutionNote && <p className="mt-2 rounded-lg bg-ink-50 p-3 text-sm">آخر سبب/رد: {item.resolutionNote}</p>}
          {canManage && <div className="mt-4 grid gap-3 border-t border-ink-100 pt-4">
            <label className="grid gap-1 text-sm font-semibold text-ink-700">سبب الإجراء
              <textarea value={reasons[item.id] ?? ""} onChange={(e) => setReasons((current) => ({ ...current, [item.id]: e.target.value }))} minLength={5} maxLength={1000} rows={2} className="rounded-xl border border-ink-200 p-3" />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-ink-700">مبلغ التسوية المعتمد (اختياري، للتوثيق فقط)
              <input type="number" min="0" max={item.order.acceptedQuote?.totalPrice ?? 0} step="0.01" value={amounts[item.id] ?? ""} onChange={(e) => setAmounts((current) => ({ ...current, [item.id]: e.target.value }))} className="rounded-xl border border-ink-200 p-3" />
            </label>
            <p className="text-xs text-ink-500">تسجيل مبلغ التسوية لا ينفذ تحويلًا أو خصمًا ماليًا.</p>
            <div className="flex flex-wrap gap-2">
              {item.status === "OPEN" && <button disabled={busy === item.id} onClick={() => void change(item, "UNDER_REVIEW")} className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-bold text-brand-700">بدء المراجعة</button>}
              {(item.status === "UNDER_REVIEW" || item.status === "OPEN") && <button disabled={busy === item.id} onClick={() => void change(item, "RESOLVED")} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white">إغلاق بعد المعالجة</button>}
              {(item.status === "UNDER_REVIEW" || item.status === "OPEN") && <button disabled={busy === item.id} onClick={() => void change(item, "REJECTED")} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700">رفض مع السبب</button>}
              {(item.status === "RESOLVED" || item.status === "REJECTED") && <button disabled={busy === item.id} onClick={() => void change(item, "UNDER_REVIEW")} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-bold">إعادة فتح للمراجعة</button>}
            </div>
          </div>}
        </article>
      ))}
    </div>
  );
}
