"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface CompanyRow {
  id: string;
  name: string;
  crNumber: string | null;
  status: string;
  user: { phone: string | null; name: string | null };
  serviceAreas: { city: { name: string } }[];
}

interface RepRow {
  id: string;
  referralCode: string;
  status: string;
  user: { phone: string | null; name: string | null };
}

export function AdminApprovals() {
  const t = useTranslations("Admin");
  const [companies, setCompanies] = useState<CompanyRow[] | null>(null);
  const [reps, setReps] = useState<RepRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((d) => d.ok && setCompanies(d.companies));
    fetch("/api/admin/reps")
      .then((r) => r.json())
      .then((d) => d.ok && setReps(d.reps));
  }

  useEffect(() => {
    load();
  }, []);

  async function act(kind: "companies" | "reps", id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await fetch(`/api/admin/${kind}/${id}/${action}`, { method: "POST" });
      load();
    } finally {
      setBusyId(null);
    }
  }

  const pendingCompanies = companies?.filter((c) => c.status === "PENDING_REVIEW") ?? [];
  const pendingReps = reps?.filter((r) => r.status === "PENDING") ?? [];

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-bold text-ink-900">{t("pendingCompanies")}</h2>
        {companies === null ? (
          <p className="mt-2 text-sm text-ink-400">…</p>
        ) : pendingCompanies.length === 0 ? (
          <p className="mt-2 text-sm text-ink-400">{t("noneNow")}</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {pendingCompanies.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white p-4"
              >
                <div>
                  <p className="font-bold text-ink-900">{c.name}</p>
                  <p className="text-xs text-ink-500">
                    {t("crNumberLabel")}: {c.crNumber} · {c.user.phone} ·{" "}
                    {c.serviceAreas.map((a) => a.city.name).join(", ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={busyId === c.id}
                    onClick={() => act("companies", c.id, "approve")}
                    className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {t("approve")}
                  </button>
                  <button
                    disabled={busyId === c.id}
                    onClick={() => act("companies", c.id, "reject")}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-ink-900">{t("pendingReps")}</h2>
        {reps === null ? (
          <p className="mt-2 text-sm text-ink-400">…</p>
        ) : pendingReps.length === 0 ? (
          <p className="mt-2 text-sm text-ink-400">{t("noneNow")}</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {pendingReps.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white p-4"
              >
                <div>
                  <p className="font-bold text-ink-900">{r.user.name}</p>
                  <p className="text-xs text-ink-500">{r.user.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={busyId === r.id}
                    onClick={() => act("reps", r.id, "approve")}
                    className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {t("approve")}
                  </button>
                  <button
                    disabled={busyId === r.id}
                    onClick={() => act("reps", r.id, "reject")}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
