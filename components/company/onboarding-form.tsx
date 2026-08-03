"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface City {
  id: string;
  name: string;
}

const ALLOWED_CR_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_CR_FILE_BYTES = 3 * 1024 * 1024;

export function CompanyOnboardingForm() {
  const t = useTranslations("Company");
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [cityIds, setCityIds] = useState<string[]>([]);
  const [crDocument, setCrDocument] = useState<{ mimeType: string; dataBase64: string } | null>(
    null
  );
  const [crDocumentName, setCrDocumentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setCities(data.cities);
      });
  }, []);

  function toggleCity(id: string) {
    setCityIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setCrDocument(null);
      setCrDocumentName("");
      return;
    }
    if (!ALLOWED_CR_MIME_TYPES.includes(file.type)) {
      setError(t("crDocInvalidType"));
      e.target.value = "";
      return;
    }
    if (file.size > MAX_CR_FILE_BYTES) {
      setError(t("crDocTooLarge"));
      e.target.value = "";
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const dataBase64 = result.slice(result.indexOf(",") + 1);
      setCrDocument({ mimeType: file.type, dataBase64 });
      setCrDocumentName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/company/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nameEn: nameEn || undefined,
          crNumber,
          cityIds,
          crDocument,
        }),
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
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-ink-900">{t("onboardingTitle")}</h2>
      <p className="mt-1 text-sm text-ink-500">{t("onboardingSubtitle")}</p>

      <div className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-800">{t("companyName")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-800">{t("companyNameEn")}</span>
          <input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            dir="ltr"
            className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-800">{t("crNumber")}</span>
          <input
            value={crNumber}
            onChange={(e) => setCrNumber(e.target.value)}
            dir="ltr"
            className="rounded-xl border border-ink-200 px-4 py-3 focus:border-brand-500 focus:outline-none"
          />
          <span className="text-xs text-ink-400">{t("crNumberHint")}</span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-800">{t("crDocument")}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileChange}
            className="rounded-xl border border-ink-200 px-4 py-3 text-sm file:me-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700"
          />
          {crDocumentName && (
            <span className="text-xs font-medium text-green-700">
              {t("crDocSelected")}: {crDocumentName}
            </span>
          )}
          <span className="text-xs text-ink-400">{t("crDocHint")}</span>
        </label>

        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-800">{t("serviceCities")}</span>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCity(c.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                  cityIds.includes(c.id)
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-ink-200 text-ink-700"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          onClick={submit}
          disabled={loading || !name || !crNumber || cityIds.length === 0 || !crDocument}
          className="rounded-full bg-brand-500 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? t("submitting") : t("submitOnboarding")}
        </button>
      </div>
    </div>
  );
}
