"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function CompleteOrderButton({ orderId }: { orderId: string }) {
  const t = useTranslations("OrderDetail");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function complete() {
    if (!window.confirm(t("completeConfirm"))) return;
    setLoading(true);
    try {
      await fetch(`/api/orders/${orderId}/complete`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={complete}
      disabled={loading}
      className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
    >
      {loading ? t("completing") : t("markComplete")}
    </button>
  );
}

export function RatingForm({ orderId }: { orderId: string }) {
  const t = useTranslations("OrderDetail");
  const router = useRouter();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? t("errorGeneric"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
      <p className="font-bold text-ink-900">{t("rateTitle")}</p>
      <div className="mt-3 flex gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            className={`text-2xl ${n <= stars ? "text-amber-400" : "text-ink-200"}`}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("commentPlaceholder")}
        rows={2}
        className="mt-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={loading}
        className="mt-3 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading ? t("submittingRating") : t("submitRating")}
      </button>
    </div>
  );
}

export function RatingDisplay({ stars, comment }: { stars: number; comment: string | null }) {
  const t = useTranslations("OrderDetail");
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <p className="font-bold text-ink-900">{t("yourRating")}</p>
      <div className="mt-2 text-xl text-amber-400" dir="ltr">
        {"★".repeat(stars)}
        <span className="text-ink-200">{"★".repeat(5 - stars)}</span>
      </div>
      {comment && <p className="mt-2 text-sm text-ink-600">{comment}</p>}
    </div>
  );
}
