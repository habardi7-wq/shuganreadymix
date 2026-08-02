"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  PROJECT_TYPES,
  CONCRETE_TYPES,
  STRENGTH_GRADES,
  PUMP_TYPES,
  type ProjectType,
  type ConcreteType,
  type StrengthGrade,
  type PumpType,
} from "@/lib/enums";
import { ConcreteCalculator } from "./concrete-calculator";

interface District {
  id: string;
  name: string;
  nameEn: string;
}
interface City {
  id: string;
  name: string;
  nameEn: string;
  districts: District[];
}

export function OrderForm() {
  const t = useTranslations("Order");
  const router = useRouter();

  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [locationDetails, setLocationDetails] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("RESIDENTIAL");
  const [concreteType, setConcreteType] = useState<ConcreteType>("READY_MIX_NORMAL");
  const [strengthGrade, setStrengthGrade] = useState<StrengthGrade>("C25");
  const [quantityM3, setQuantityM3] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);
  const [pumpRequired, setPumpRequired] = useState(false);
  const [pumpType, setPumpType] = useState<PumpType>("LINE");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code: string } | null>(null);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setCities(data.cities);
      });
  }, []);

  const selectedCity = cities.find((c) => c.id === cityId);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId,
          districtId: districtId || undefined,
          locationDetails: locationDetails || undefined,
          projectType,
          concreteType,
          strengthGrade,
          quantityM3: Number(quantityM3),
          pumpRequired,
          pumpType: pumpRequired ? pumpType : undefined,
          scheduledDate,
          scheduledTime,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? t("errorGeneric"));
        return;
      }
      setSuccess({ code: data.order.code });
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-2xl">✅</p>
        <h2 className="mt-3 text-xl font-extrabold text-ink-900">{t("successTitle")}</h2>
        <p className="mt-2 text-ink-600">
          {t("successDesc")}: <span className="font-mono font-bold">{success.code}</span>
        </p>
        <p className="mt-1 text-sm text-ink-500">{t("successNote")}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => {
              router.push("/customer");
              router.refresh();
            }}
            className="rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white"
          >
            {t("viewOrder")}
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-full border border-ink-200 px-6 py-3 text-sm font-bold text-ink-700"
          >
            {t("backHome")}
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const canSubmit =
    cityId && projectType && concreteType && strengthGrade && quantityM3 && scheduledDate && scheduledTime;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-8"
    >
      {/* Location */}
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-ink-900">{t("sectionLocation")}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-800">{t("city")}</span>
            <select
              value={cityId}
              onChange={(e) => {
                setCityId(e.target.value);
                setDistrictId("");
              }}
              required
              className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
            >
              <option value="">{t("citySelect")}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-800">{t("district")}</span>
            <select
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              disabled={!selectedCity}
              className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">{t("districtSelect")}</option>
              {selectedCity?.districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-800">{t("locationDetails")}</span>
          <textarea
            value={locationDetails}
            onChange={(e) => setLocationDetails(e.target.value)}
            placeholder={t("locationDetailsPlaceholder")}
            rows={2}
            className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
          />
        </label>
      </section>

      {/* Project */}
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-ink-900">{t("sectionProject")}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-800">{t("projectType")}</span>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
              className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
            >
              {PROJECT_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`projectTypes.${v}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-800">{t("concreteType")}</span>
            <select
              value={concreteType}
              onChange={(e) => setConcreteType(e.target.value as ConcreteType)}
              className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
            >
              {CONCRETE_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`concreteTypes.${v}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-800">{t("strengthGrade")}</span>
            <select
              value={strengthGrade}
              onChange={(e) => setStrengthGrade(e.target.value as StrengthGrade)}
              className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
            >
              {STRENGTH_GRADES.map((v) => (
                <option key={v} value={v}>
                  {t(`strengthGrades.${v}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Quantity */}
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-ink-900">{t("sectionQuantity")}</h2>
        <label className="mt-4 flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-800">{t("quantity")}</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={0.1}
              step={0.01}
              value={quantityM3}
              onChange={(e) => setQuantityM3(e.target.value)}
              required
              className="w-full rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
            />
            <span className="shrink-0 text-sm font-semibold text-ink-500">
              {t("quantityUnit")}
            </span>
          </div>
        </label>
        <p className="mt-2 text-sm text-ink-500">
          {t("calculatorPrompt")}{" "}
          <button
            type="button"
            onClick={() => setShowCalculator((v) => !v)}
            className="font-semibold text-brand-700 underline underline-offset-2"
          >
            {t("calculatorLink")}
          </button>
        </p>
        {showCalculator && (
          <ConcreteCalculator
            onApply={(qty) => {
              setQuantityM3(String(qty));
              setShowCalculator(false);
            }}
            onClose={() => setShowCalculator(false)}
          />
        )}
      </section>

      {/* Pump */}
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-ink-900">{t("sectionPump")}</h2>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm font-semibold text-ink-800">{t("pumpRequired")}</span>
          <div className="flex overflow-hidden rounded-full border border-ink-200">
            <button
              type="button"
              onClick={() => setPumpRequired(true)}
              className={`px-4 py-2 text-sm font-semibold ${pumpRequired ? "bg-brand-500 text-white" : "text-ink-600"}`}
            >
              {t("yes")}
            </button>
            <button
              type="button"
              onClick={() => setPumpRequired(false)}
              className={`px-4 py-2 text-sm font-semibold ${!pumpRequired ? "bg-brand-500 text-white" : "text-ink-600"}`}
            >
              {t("no")}
            </button>
          </div>
        </div>
        {pumpRequired && (
          <label className="mt-4 flex flex-col gap-1.5 text-sm sm:max-w-xs">
            <span className="font-semibold text-ink-800">{t("pumpType")}</span>
            <select
              value={pumpType}
              onChange={(e) => setPumpType(e.target.value as PumpType)}
              className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
            >
              {PUMP_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`pumpTypes.${v}`)}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      {/* Schedule */}
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-ink-900">{t("sectionSchedule")}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-800">{t("scheduledDate")}</span>
            <input
              type="date"
              min={today}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-800">{t("scheduledTime")}</span>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
              className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-800">{t("notes")}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            rows={3}
            className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
          />
        </label>
      </section>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="rounded-full bg-brand-500 py-4 text-base font-bold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 disabled:opacity-50"
      >
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
