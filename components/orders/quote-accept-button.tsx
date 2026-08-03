"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function QuoteAcceptButton({ quoteId }: { quoteId: string }) {
  const t = useTranslations("OrderDetail");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!window.confirm(t("acceptConfirm"))) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/accept`, { method: "POST" });
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
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={accept}
        disabled={loading}
        className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading ? t("accepting") : t("accept")}
      </button>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
