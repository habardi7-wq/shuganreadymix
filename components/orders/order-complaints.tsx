"use client";

import { useEffect, useState } from "react";

type Complaint = {
  id: string;
  category: string;
  description: string;
  status: string;
  requestedAdjustmentSar: number | null;
  resolutionNote: string | null;
  createdAt: string;
  deliveryLoad: { sequence: number; truckNumber: string | null } | null;
};
type Load = { id: string; sequence: number; truckNumber: string | null };

const labels: Record<string, string> = {
  OPEN: "جديدة",
  UNDER_REVIEW: "قيد المراجعة",
  RESOLVED: "تمت المعالجة",
  REJECTED: "مغلقة",
};
const categories: Record<string, string> = {
  DELIVERY: "التوصيل",
  QUALITY: "جودة الخرسانة",
  QUANTITY: "الكمية",
  BILLING: "الفاتورة أو المبلغ",
  SERVICE: "الخدمة",
  OTHER: "أخرى",
};

export function OrderComplaints({ orderId }: { orderId: string }) {
  const [items, setItems] = useState<Complaint[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [category, setCategory] = useState("DELIVERY");
  const [description, setDescription] = useState("");
  const [loadId, setLoadId] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const [complaintResponse, loadResponse] = await Promise.all([
      fetch(`/api/orders/${orderId}/complaints`, { cache: "no-store" }),
      fetch(`/api/orders/${orderId}/loads`, { cache: "no-store" }),
    ]);
    if (complaintResponse.ok) {
      const data = await complaintResponse.json();
      setItems(data.complaints ?? []);
    }
    if (loadResponse.ok) {
      const data = await loadResponse.json();
      setLoads(data.loads ?? []);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/orders/${orderId}/complaints`, { cache: "no-store" }),
      fetch(`/api/orders/${orderId}/loads`, { cache: "no-store" }),
    ])
      .then(async ([complaintResponse, loadResponse]) => {
        if (!active) return;
        if (complaintResponse.ok) setItems((await complaintResponse.json()).complaints ?? []);
        if (loadResponse.ok) setLoads((await loadResponse.json()).loads ?? []);
      })
      .catch(() => { if (active) setMessage("تعذر تحميل الشكاوى حالياً."); });
    return () => { active = false; };
  }, [orderId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/orders/${orderId}/complaints`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        category,
        description,
        ...(loadId ? { deliveryLoadId: loadId } : {}),
        ...(amount ? { requestedAdjustmentSar: Number(amount) } : {}),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error || "تعذر تسجيل الشكوى");
      return;
    }
    setDescription("");
    setAmount("");
    setLoadId("");
    setMessage("تم تسجيل الشكوى وإشعار الطرف الآخر.");
    await refresh();
  }

  return (
    <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-ink-900">الشكاوى والتسويات</h2>
      <p className="mt-1 text-sm text-ink-500">كل شكوى مرتبطة بالطلب وتظهر للطرف الآخر والإدارة. أي مبلغ مقترح لا ينفذ دفعاً.</p>

      {items.length > 0 && (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-ink-100 bg-ink-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-ink-800">{categories[item.category] ?? item.category}</strong>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700">{labels[item.status] ?? item.status}</span>
              </div>
              {item.deliveryLoad && <p className="mt-2 text-xs text-ink-500">الشاحنة {item.deliveryLoad.sequence}{item.deliveryLoad.truckNumber ? ` · ${item.deliveryLoad.truckNumber}` : ""}</p>}
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">{item.description}</p>
              {item.requestedAdjustmentSar != null && <p className="mt-2 text-sm font-semibold">التسوية المطلوبة: {item.requestedAdjustmentSar.toLocaleString("ar-SA")} ر.س</p>}
              {item.resolutionNote && <p className="mt-2 border-t border-ink-200 pt-2 text-sm text-ink-600">رد الإدارة: {item.resolutionNote}</p>}
              <time className="mt-2 block text-xs text-ink-400">{new Date(item.createdAt).toLocaleString("ar-SA")}</time>
            </article>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-5 grid gap-3">
        <label className="grid gap-1 text-sm font-semibold text-ink-700">نوع الشكوى
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-ink-200 bg-white p-3">
            {Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {loads.length > 0 && <label className="grid gap-1 text-sm font-semibold text-ink-700">الشاحنة (اختياري)
          <select value={loadId} onChange={(e) => setLoadId(e.target.value)} className="rounded-xl border border-ink-200 bg-white p-3">
            <option value="">الطلب بالكامل</option>
            {loads.map((load) => <option key={load.id} value={load.id}>الشاحنة {load.sequence}{load.truckNumber ? ` — ${load.truckNumber}` : ""}</option>)}
          </select>
        </label>}
        <label className="grid gap-1 text-sm font-semibold text-ink-700">اشرح المشكلة
          <textarea required minLength={10} maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded-xl border border-ink-200 p-3" placeholder="اكتب التفاصيل التي تساعد على مراجعتها" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-ink-700">مبلغ التسوية المطلوب (اختياري)
          <input type="number" min="0" max="1000000" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-xl border border-ink-200 p-3" />
        </label>
        {message && <p role="status" className="text-sm text-ink-600">{message}</p>}
        <button disabled={busy} className="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "جارٍ التسجيل…" : "تسجيل الشكوى"}</button>
      </form>
    </section>
  );
}
