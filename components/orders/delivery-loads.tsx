"use client";

import { useCallback, useEffect, useState } from "react";
import {
  nextDeliveryLoadActions,
  type DeliveryLoadActor,
  type DeliveryLoadStatus,
} from "@/lib/delivery-load-status";

type Load = {
  id: string;
  sequence: number;
  plannedQuantityM3: number;
  receivedQuantityM3: number | null;
  truckNumber: string | null;
  status: DeliveryLoadStatus;
  note: string | null;
  dispatchedAt: string | null;
  arrivedAt: string | null;
  receivedAt: string | null;
};

type Totals = { planned: number; received: number; remaining: number };

const labels: Record<DeliveryLoadStatus, string> = {
  PLANNED: "مخططة",
  DISPATCHED: "خرجت من المصنع",
  ARRIVED: "وصلت الموقع",
  RECEIVED: "استلمها العميل",
  ISSUE_REPORTED: "عليها مشكلة",
  CANCELLED: "ملغاة",
};

const actionLabels: Partial<Record<DeliveryLoadStatus, string>> = {
  PLANNED: "إعادة للجدولة",
  DISPATCHED: "تسجيل الخروج",
  ARRIVED: "تسجيل الوصول",
  RECEIVED: "تأكيد الكمية المستلمة",
  ISSUE_REPORTED: "تسجيل مشكلة",
  CANCELLED: "إلغاء الدفعة",
};

export function DeliveryLoads({ orderId }: { orderId: string }) {
  const [role, setRole] = useState<DeliveryLoadActor>("CUSTOMER");
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [totals, setTotals] = useState<Totals>({ planned: 0, received: 0, remaining: 0 });
  const [loads, setLoads] = useState<Load[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [received, setReceived] = useState<Record<string, string>>({});
  const [planned, setPlanned] = useState<Record<string, string>>({});
  const [truckNumbers, setTruckNumbers] = useState<Record<string, string>>({});
  const [newQuantity, setNewQuantity] = useState("");
  const [newTruck, setNewTruck] = useState("");
  const [newNote, setNewNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const response = await fetch(`/api/orders/${orderId}/loads`, { cache: "no-store" });
    const result = (await response.json()) as {
      ok: boolean;
      role?: DeliveryLoadActor;
      orderQuantityM3?: number;
      totals?: Totals;
      loads?: Load[];
      error?: string;
    };
    if (!response.ok || !result.ok) {
      setError(result.error ?? "تعذر تحميل دفعات التوريد");
      return;
    }
    const rows = result.loads ?? [];
    setRole(result.role ?? "CUSTOMER");
    setOrderQuantity(result.orderQuantityM3 ?? 0);
    setTotals(result.totals ?? { planned: 0, received: 0, remaining: 0 });
    setLoads(rows);
    setPlanned(Object.fromEntries(rows.map((item) => [item.id, String(item.plannedQuantityM3)])));
    setTruckNumbers(Object.fromEntries(rows.map((item) => [item.id, item.truckNumber ?? ""])));
  }, [orderId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function createLoad() {
    setBusy("create");
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/loads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plannedQuantityM3: Number(newQuantity),
          truckNumber: newTruck || undefined,
          note: newNote || undefined,
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "تعذر إضافة الشاحنة");
      setNewQuantity("");
      setNewTruck("");
      setNewNote("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إضافة الشاحنة");
    } finally {
      setBusy(null);
    }
  }

  async function updateLoad(item: Load, status: DeliveryLoadStatus, correction = false) {
    const note = notes[item.id]?.trim() ?? "";
    const requiresNote =
      correction ||
      status === "ISSUE_REPORTED" ||
      status === "CANCELLED" ||
      item.status === "ISSUE_REPORTED" ||
      item.status === "CANCELLED";
    if (requiresNote && note.length < 5) {
      setError("اكتب سبباً واضحاً لا يقل عن 5 أحرف");
      return;
    }
    if (!window.confirm(correction ? "حفظ تصحيح بيانات الشاحنة مع السبب؟" : `تحديث الشاحنة إلى: ${labels[status]}؟`)) return;

    setBusy(item.id);
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/loads/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: note || undefined,
          receivedQuantityM3: status === "RECEIVED" ? Number(received[item.id]) : undefined,
          plannedQuantityM3: correction ? Number(planned[item.id]) : undefined,
          truckNumber: correction ? truckNumbers[item.id] || undefined : undefined,
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "تعذر تحديث الشاحنة");
      setNotes((current) => ({ ...current, [item.id]: "" }));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحديث الشاحنة");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-extrabold text-ink-900">الشاحنات والكميات المستلمة</h2>
        <p className="mt-1 text-sm text-ink-500">كل شاحنة تُتابع بشكل مستقل، والعميل يؤكد الكمية الفعلية.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["كمية الطلب", orderQuantity],
          ["المخطط", totals.planned],
          ["المستلم", totals.received],
          ["المتبقي", totals.remaining],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl bg-ink-50 p-3">
            <p className="text-xs text-ink-500">{label}</p>
            <p className="mt-1 text-lg font-black text-ink-900">{Number(value).toLocaleString()} م³</p>
          </div>
        ))}
      </div>

      {role === "COMPANY" && (
        <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="font-bold text-ink-900">إضافة شاحنة/دفعة توريد</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <input type="number" min="0.1" step="0.01" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} placeholder="الكمية م³" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
            <input value={newTruck} onChange={(e) => setNewTruck(e.target.value)} placeholder="رقم الشاحنة" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
            <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="ملاحظة اختيارية" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
          </div>
          <button type="button" onClick={() => void createLoad()} disabled={busy === "create" || !newQuantity} className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {busy === "create" ? "جاري الإضافة…" : "إضافة الشاحنة"}
          </button>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {loads.map((item) => {
          const actions = nextDeliveryLoadActions(item.status, role);
          return (
            <article key={item.id} className={`rounded-xl border p-4 ${item.status === "ISSUE_REPORTED" ? "border-red-200 bg-red-50/40" : "border-ink-100"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-ink-900">الشاحنة {item.sequence}</p>
                  <p className="mt-1 text-sm text-ink-500">{item.truckNumber ? `رقم المركبة: ${item.truckNumber}` : "رقم المركبة غير محدد"}</p>
                </div>
                <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-bold text-ink-700">{labels[item.status]}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <p><span className="text-ink-400">المخطط: </span><strong>{item.plannedQuantityM3} م³</strong></p>
                <p><span className="text-ink-400">المستلم: </span><strong>{item.receivedQuantityM3 ?? "—"} {item.receivedQuantityM3 != null ? "م³" : ""}</strong></p>
              </div>
              {item.note && <p className="mt-3 rounded-lg bg-white p-3 text-sm text-ink-700">{item.note}</p>}

              {role === "COMPANY" && item.status === "PLANNED" && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input type="number" min="0.1" step="0.01" value={planned[item.id] ?? ""} onChange={(e) => setPlanned((current) => ({ ...current, [item.id]: e.target.value }))} className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
                  <input value={truckNumbers[item.id] ?? ""} onChange={(e) => setTruckNumbers((current) => ({ ...current, [item.id]: e.target.value }))} placeholder="رقم الشاحنة" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
                </div>
              )}

              {actions.length > 0 && (
                <div className="mt-3">
                  {role === "CUSTOMER" && actions.includes("RECEIVED") && (
                    <input type="number" min="0.1" step="0.01" value={received[item.id] ?? ""} onChange={(e) => setReceived((current) => ({ ...current, [item.id]: e.target.value }))} placeholder="الكمية المستلمة فعلياً م³" className="mb-2 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm sm:max-w-xs" />
                  )}
                  <textarea value={notes[item.id] ?? ""} onChange={(e) => setNotes((current) => ({ ...current, [item.id]: e.target.value }))} maxLength={500} rows={2} placeholder="سبب التصحيح، المشكلة أو ملاحظة التحديث…" className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {role === "COMPANY" && item.status === "PLANNED" && (
                      <button type="button" onClick={() => void updateLoad(item, item.status, true)} disabled={busy === item.id} className="rounded-lg border border-ink-300 px-3 py-2 text-xs font-bold text-ink-700 disabled:opacity-50">حفظ تصحيح البيانات</button>
                    )}
                    {actions.map((action) => (
                      <button key={action} type="button" onClick={() => void updateLoad(item, action)} disabled={busy === item.id || (action === "RECEIVED" && !received[item.id])} className={`rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${action === "ISSUE_REPORTED" || action === "CANCELLED" ? "bg-red-600" : action === "RECEIVED" ? "bg-green-600" : "bg-brand-600"}`}>
                        {busy === item.id ? "جاري الحفظ…" : actionLabels[action]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
        {loads.length === 0 && <p className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">لم تُضف شاحنات لهذا الطلب بعد.</p>}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
    </section>
  );
}
