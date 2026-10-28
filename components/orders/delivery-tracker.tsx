"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  nextDeliveryActions,
  type DeliveryActorRole,
  type DeliveryStatus,
} from "@/lib/delivery-status";

type DeliveryEvent = {
  id: string;
  status: DeliveryStatus;
  note: string | null;
  createdAt: string;
  isMine: boolean;
  actorRole: string;
};

const labels: Record<DeliveryStatus, string> = {
  NOT_SCHEDULED: "بانتظار جدولة المصنع",
  SCHEDULED: "تمت جدولة التوريد",
  DISPATCHED: "خرجت الشاحنة من المصنع",
  ARRIVED: "وصلت الشاحنة إلى الموقع",
  DELIVERED: "تم الاستلام",
  ISSUE_REPORTED: "توجد ملاحظة على التوريد",
};

const actionLabels: Partial<Record<DeliveryStatus, string>> = {
  SCHEDULED: "تأكيد الجدولة",
  DISPATCHED: "تسجيل خروج الشاحنة",
  ARRIVED: "تسجيل الوصول للموقع",
  DELIVERED: "تأكيد الاستلام",
  ISSUE_REPORTED: "تسجيل مشكلة",
};

export function DeliveryTracker({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<DeliveryStatus>("NOT_SCHEDULED");
  const [actorRole, setActorRole] = useState<DeliveryActorRole>("CUSTOMER");
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<DeliveryStatus | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const response = await fetch(`/api/orders/${orderId}/delivery`, { cache: "no-store" });
    const result = (await response.json()) as {
      ok: boolean;
      currentStatus?: DeliveryStatus;
      actorRole?: DeliveryActorRole;
      events?: DeliveryEvent[];
      error?: string;
    };
    if (!response.ok || !result.ok || !result.currentStatus || !result.actorRole) {
      setError(result.error ?? "تعذر تحميل حالة التوريد");
      setLoading(false);
      return;
    }
    setCurrentStatus(result.currentStatus);
    setActorRole(result.actorRole);
    setEvents(result.events ?? []);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function update(next: DeliveryStatus) {
    const requiresNote = next === "ISSUE_REPORTED" || currentStatus === "ISSUE_REPORTED";
    if (requiresNote && note.trim().length < 5) {
      setError("اكتب ملاحظة واضحة لا تقل عن 5 أحرف");
      return;
    }

    const confirmation =
      next === "DELIVERED"
        ? "تأكيد الاستلام سيكمل الطلب ويُنشئ أثره المالي. هل أنت متأكد؟"
        : `تغيير حالة التوريد إلى: ${labels[next]}؟`;
    if (!window.confirm(confirmation)) return;

    setBusy(next);
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, note: note.trim() || undefined }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "تعذر تحديث التوريد");
      setNote("");
      await load();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحديث التوريد");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-ink-100 bg-white p-5 text-sm text-ink-400">جاري تحميل التوريد…</div>;
  }

  const actions = nextDeliveryActions(currentStatus, actorRole);

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink-900">تتبع التوريد والاستلام</h2>
          <p className="mt-1 text-sm text-ink-500">كل تحديث محفوظ باسم المنفذ ووقته ولا يُمسح من السجل.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${currentStatus === "ISSUE_REPORTED" ? "bg-red-100 text-red-700" : currentStatus === "DELIVERED" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
          {labels[currentStatus]}
        </span>
      </div>

      <div className="mt-5 space-y-3 border-s-2 border-ink-100 ps-5">
        {events.map((event) => (
          <div key={event.id} className="relative rounded-xl bg-ink-50 p-3">
            <span className="absolute -start-[27px] top-4 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-ink-900">{labels[event.status]}</p>
              <time className="text-xs text-ink-400">{new Date(event.createdAt).toLocaleString("ar-SA")}</time>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              {event.isMine ? "بواسطتك" : event.actorRole === "COMPANY" ? "بواسطة المصنع" : "بواسطة العميل"}
            </p>
            {event.note && <p className="mt-2 text-sm text-ink-700">{event.note}</p>}
          </div>
        ))}
        {events.length === 0 && <p className="text-sm text-ink-400">لم تبدأ تحديثات التوريد بعد.</p>}
      </div>

      {actions.length > 0 && (
        <div className="mt-5 border-t border-ink-100 pt-4">
          <label className="block text-sm font-bold text-ink-700">
            ملاحظة التحديث
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="رقم الشاحنة، موعد الوصول، تفاصيل المشكلة أو المعالجة…"
              className="mt-2 w-full rounded-xl border border-ink-200 px-3 py-2 font-normal outline-none focus:border-brand-500"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => void update(action)}
                disabled={busy !== null}
                className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${action === "ISSUE_REPORTED" ? "bg-red-600" : action === "DELIVERED" ? "bg-green-600" : "bg-brand-600"}`}
              >
                {busy === action ? "جاري الحفظ…" : actionLabels[action]}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
    </section>
  );
}
