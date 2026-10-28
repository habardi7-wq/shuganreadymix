"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

type PhoneRole = "CUSTOMER" | "COMPANY" | "SALES_REP";

const DASHBOARD_PATH: Record<PhoneRole, string> = {
  CUSTOMER: "/customer",
  COMPANY: "/company",
  SALES_REP: "/rep",
};

const ROLE_NOTE_KEY: Record<PhoneRole, string | null> = {
  CUSTOMER: null,
  COMPANY: "companyNote",
  SALES_REP: "repNote",
};

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();

  const [role, setRole] = useState<PhoneRole>("CUSTOMER");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [purpose, setPurpose] = useState<"REGISTER" | "LOGIN" | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [deliveryChannel, setDeliveryChannel] = useState<"WHATSAPP" | "SMS" | "CONSOLE">("WHATSAPP");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [done, setDone] = useState<{ pending: boolean } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function requestCode() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? t("errorGeneric"));
        return;
      }
      setPurpose(data.purpose);
      setDevCode(data.devCode ?? null);
      setDeliveryChannel(data.deliveryChannel ?? "WHATSAPP");
      setStep("code");
      setCooldown(30);
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          role,
          code,
          name: purpose === "REGISTER" ? name : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? t("errorGeneric"));
        return;
      }

      if (data.user.status === "PENDING_APPROVAL") {
        setDone({ pending: true });
        return;
      }

      setInfo(data.isNew ? t("accountCreated") : t("welcomeBack"));
      router.push(next || DASHBOARD_PATH[role]);
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (done?.pending) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-bold text-ink-900">{t("accountCreated")}</p>
        <p className="mt-2 text-sm text-ink-600">{t("pendingApproval")}</p>
        <button
          onClick={() => {
            router.push(DASHBOARD_PATH[role]);
            router.refresh();
          }}
          className="mt-5 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white"
        >
          {t("goToDashboard")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
      <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl bg-ink-50 p-1">
        {(["CUSTOMER", "COMPANY", "SALES_REP"] as PhoneRole[]).map((r) => (
          <button
            key={r}
            type="button"
            disabled={step === "code"}
            onClick={() => setRole(r)}
            className={`rounded-lg py-2 text-xs font-bold transition sm:text-sm ${
              role === r ? "bg-white text-brand-700 shadow-sm" : "text-ink-500"
            } disabled:opacity-50`}
          >
            {t(r === "CUSTOMER" ? "roleCustomer" : r === "COMPANY" ? "roleCompany" : "roleRep")}
          </button>
        ))}
      </div>

      {step === "phone" && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-800">{t("phoneLabel")}</span>
            <input
              type="tel"
              inputMode="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              className="rounded-xl border border-ink-200 px-4 py-3 text-start focus:border-brand-500 focus:outline-none"
            />
          </label>
          {ROLE_NOTE_KEY[role] && (
            <p className="rounded-lg bg-brand-50 p-3 text-xs text-brand-800">
              {t(ROLE_NOTE_KEY[role] as "companyNote" | "repNote")}
            </p>
          )}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button
            onClick={requestCode}
            disabled={loading || phone.length < 9}
            className="rounded-full bg-brand-500 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? t("sending") : t("sendCode")}
          </button>
        </div>
      )}

      {step === "code" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-600">
            {t(deliveryChannel === "SMS" ? "codeSentSms" : deliveryChannel === "CONSOLE" ? "codeSentDev" : "codeSentWhatsApp")} {" "}
            <span dir="ltr" className="font-semibold">{phone}</span>
          </p>
          {devCode && (
            <p className="rounded-lg bg-ink-900 px-3 py-2 text-xs font-mono text-white">
              {t("devCodeHint")}: {devCode}
            </p>
          )}
          {purpose === "REGISTER" && (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-ink-800">{t("nameLabel")}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-800">{t("codeLabel")}</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              dir="ltr"
              inputMode="numeric"
              maxLength={6}
              className="rounded-xl border border-ink-200 px-4 py-3 text-center text-lg tracking-[0.5em] focus:border-brand-500 focus:outline-none"
            />
          </label>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {info && <p className="text-sm font-medium text-green-700">{info}</p>}
          <button
            onClick={verifyCode}
            disabled={loading || code.length !== 6 || (purpose === "REGISTER" && !name)}
            className="rounded-full bg-brand-500 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? t("verifying") : t("verify")}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="text-ink-500 underline"
            >
              {t("changePhone")}
            </button>
            <button
              type="button"
              disabled={cooldown > 0}
              onClick={requestCode}
              className="font-semibold text-brand-700 disabled:text-ink-400"
            >
              {t("resend")} {cooldown > 0 ? `(${cooldown})` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
