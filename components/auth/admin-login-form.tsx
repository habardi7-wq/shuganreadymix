"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function AdminLoginForm() {
  const t = useTranslations("AdminLogin");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? t("error"));
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-800">{t("email")}</span>
          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-800">{t("password")}</span>
          <input
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
          />
        </label>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          onClick={submit}
          disabled={loading || !email || !password}
          className="rounded-full bg-ink-900 py-3 text-sm font-bold text-white transition hover:bg-ink-700 disabled:opacity-50"
        >
          {loading ? t("submitting") : t("submit")}
        </button>
        <p className="text-center text-xs text-ink-400">{t("demoNote")}</p>
      </div>
    </div>
  );
}
