"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { COMMISSION_TYPES, type CommissionType } from "@/lib/enums";

interface Setting {
  id: string;
  scope: string;
  companyId: string | null;
  company: { name: string } | null;
  type: string;
  value: number;
  isActive: boolean;
}

export function CommissionSettings() {
  const t = useTranslations("Admin");
  const [settings, setSettings] = useState<Setting[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/commission-settings")
      .then((r) => r.json())
      .then((d) => d.ok && setSettings(d.settings));
  }

  useEffect(() => {
    load();
  }, []);

  async function update(id: string, patch: Partial<{ type: CommissionType; value: number; isActive: boolean }>) {
    setSavingId(id);
    try {
      await fetch(`/api/admin/commission-settings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      load();
    } finally {
      setSavingId(null);
    }
  }

  if (settings === null) {
    return <p className="text-sm text-ink-400">…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {settings.map((s) => (
        <div
          key={s.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white p-4"
        >
          <div>
            <p className="font-bold text-ink-900">
              {s.scope === "GLOBAL" ? t("globalCommission") : s.company?.name}
            </p>
            <p className="text-xs text-ink-500">{s.isActive ? t("active") : t("inactive")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={s.type}
              disabled={savingId === s.id}
              onChange={(e) => update(s.id, { type: e.target.value as CommissionType })}
              className="rounded-lg border border-ink-200 px-2 py-1.5 text-sm"
            >
              {COMMISSION_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {t(`commissionType${ct}` as never)}
                </option>
              ))}
            </select>
            <input
              type="number"
              defaultValue={s.value}
              disabled={savingId === s.id}
              onBlur={(e) => {
                const value = Number(e.target.value);
                if (value !== s.value) update(s.id, { value });
              }}
              className="w-24 rounded-lg border border-ink-200 px-2 py-1.5 text-sm"
            />
            <button
              disabled={savingId === s.id}
              onClick={() => update(s.id, { isActive: !s.isActive })}
              className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700"
            >
              {s.isActive ? t("deactivate") : t("activate")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
