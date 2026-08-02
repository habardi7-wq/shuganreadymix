"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

export function ConcreteCalculator({
  onApply,
  onClose,
}: {
  onApply: (quantityM3: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("Calculator");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [waste, setWaste] = useState("5");

  const result = useMemo(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const th = parseFloat(thickness);
    const wastePct = parseFloat(waste) || 0;
    if (!l || !w || !th || l <= 0 || w <= 0 || th <= 0) return null;
    const base = l * w * (th / 100);
    const withWaste = base * (1 + wastePct / 100);
    return Math.round(withWaste * 100) / 100;
  }, [length, width, thickness, waste]);

  return (
    <div className="mt-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-ink-900">{t("title")}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-ink-500 hover:text-ink-800"
        >
          {t("close")}
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-500">{t("subtitle")}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-ink-700">{t("length")}</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-ink-700">{t("width")}</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-ink-700">{t("thickness")}</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={thickness}
            onChange={(e) => setThickness(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-ink-700">{t("waste")}</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={waste}
            onChange={(e) => setWaste(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-700">
          {t("resultLabel")}:{" "}
          <span className="text-lg font-black text-brand-700">
            {result !== null ? `${result} m³` : "—"}
          </span>
        </p>
        <button
          type="button"
          disabled={result === null}
          onClick={() => result !== null && onApply(result)}
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          {t("apply")}
        </button>
      </div>
      <p className="mt-3 text-xs text-ink-500">{t("note")}</p>
    </div>
  );
}
