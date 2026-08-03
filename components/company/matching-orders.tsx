"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface MyQuote {
  id: string;
  pricePerM3: number;
  pumpPrice: number | null;
  totalPrice: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
}

interface MatchingOrder {
  id: string;
  code: string;
  city: { name: string };
  district: { name: string } | null;
  locationDetails: string | null;
  projectType: string;
  concreteType: string;
  strengthGrade: string;
  quantityM3: number;
  pumpRequired: boolean;
  pumpType: string | null;
  scheduledAt: string;
  notes: string | null;
  status: string;
  myQuote: MyQuote | null;
}

export function MatchingOrders() {
  const t = useTranslations("Company");
  const tOrder = useTranslations("Order");
  const [orders, setOrders] = useState<MatchingOrder[] | null>(null);
  const [openFormFor, setOpenFormFor] = useState<string | null>(null);

  function load() {
    fetch("/api/company/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setOrders(data.orders);
      });
  }

  useEffect(() => {
    load();
  }, []);

  if (orders === null) {
    return <p className="text-sm text-ink-400">…</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 p-8 text-center text-ink-500">
        {t("noOrders")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-sm font-bold text-ink-900">{order.code}</span>
            <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-700">
              {tOrder(`projectTypes.${order.projectType}` as never)}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-ink-600">
            <p>
              <span className="text-ink-400">{t("locationLabel")}: </span>
              {order.city.name}
              {order.district ? ` — ${order.district.name}` : ""}
            </p>
            <p>
              <span className="text-ink-400">{t("quantityLabel")}: </span>
              {order.quantityM3} m³
            </p>
            <p>
              <span className="text-ink-400">{tOrder("concreteType")}: </span>
              {tOrder(`concreteTypes.${order.concreteType}` as never)}
            </p>
            <p>
              <span className="text-ink-400">{tOrder("strengthGrade")}: </span>
              {order.strengthGrade}
            </p>
            <p>
              <span className="text-ink-400">{t("scheduledLabel")}: </span>
              {new Date(order.scheduledAt).toLocaleString("ar-SA-u-ca-gregory-nu-latn")}
            </p>
            {order.pumpRequired && (
              <p>
                <span className="text-ink-400">{tOrder("pumpType")}: </span>
                {order.pumpType ? tOrder(`pumpTypes.${order.pumpType}` as never) : "-"}
              </p>
            )}
          </div>

          {order.notes && (
            <p className="mt-3 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">{order.notes}</p>
          )}

          <div className="mt-4 border-t border-ink-100 pt-4">
            {order.myQuote ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-600">
                    {t("myQuoteSent")}{" "}
                    <span className="font-bold text-ink-900">
                      {order.myQuote.totalPrice.toLocaleString()} ر.س
                    </span>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-brand-700">
                    {t(`myQuoteStatus${order.myQuote.status}` as never)}
                  </p>
                </div>
                {order.myQuote.status === "PENDING" && (
                  <button
                    onClick={() => setOpenFormFor(order.id)}
                    className="rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700"
                  >
                    {t("editQuote")}
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setOpenFormFor(order.id)}
                className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white"
              >
                {t("sendQuote")}
              </button>
            )}
          </div>

          {openFormFor === order.id && (
            <QuoteForm
              orderId={order.id}
              quantityM3={order.quantityM3}
              pumpRequired={order.pumpRequired}
              defaultPricePerM3={order.myQuote?.pricePerM3}
              defaultPumpPrice={order.myQuote?.pumpPrice ?? undefined}
              onClose={() => setOpenFormFor(null)}
              onSubmitted={() => {
                setOpenFormFor(null);
                load();
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function QuoteForm({
  orderId,
  quantityM3,
  pumpRequired,
  defaultPricePerM3,
  defaultPumpPrice,
  onClose,
  onSubmitted,
}: {
  orderId: string;
  quantityM3: number;
  pumpRequired: boolean;
  defaultPricePerM3?: number;
  defaultPumpPrice?: number;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const t = useTranslations("Company");
  const [pricePerM3, setPricePerM3] = useState(defaultPricePerM3?.toString() ?? "");
  const [pumpPrice, setPumpPrice] = useState(defaultPumpPrice?.toString() ?? "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total =
    (parseFloat(pricePerM3) || 0) * quantityM3 + (parseFloat(pumpPrice) || 0);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          pricePerM3: Number(pricePerM3),
          pumpPrice: pumpPrice ? Number(pumpPrice) : undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? t("errorGeneric"));
        return;
      }
      onSubmitted();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-ink-700">{t("pricePerM3")}</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={pricePerM3}
            onChange={(e) => setPricePerM3(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        {pumpRequired && (
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-ink-700">{t("pumpPrice")}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={pumpPrice}
              onChange={(e) => setPumpPrice(e.target.value)}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
        )}
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs">
        <span className="font-semibold text-ink-700">{t("notes")}</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <p className="mt-3 text-sm text-ink-700">
        {t("totalPreview")}: <span className="font-bold text-brand-700">{total.toLocaleString()} ر.س</span>
      </p>

      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={submit}
          disabled={loading || !pricePerM3}
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? t("submitting") : t("submit")}
        </button>
        <button
          onClick={onClose}
          className="rounded-full border border-ink-200 px-5 py-2 text-sm font-semibold text-ink-700"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
