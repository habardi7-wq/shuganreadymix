import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function HomePage() {
  const t = await getTranslations("Home");

  const steps = [
    { title: t("step1Title"), desc: t("step1Desc"), n: "01" },
    { title: t("step2Title"), desc: t("step2Desc"), n: "02" },
    { title: t("step3Title"), desc: t("step3Desc"), n: "03" },
    { title: t("step4Title"), desc: t("step4Desc"), n: "04" },
  ];

  const users = [
    { title: t("userCustomer"), desc: t("userCustomerDesc"), icon: "🧑‍💼" },
    { title: t("userCompany"), desc: t("userCompanyDesc"), icon: "🏭" },
    { title: t("userRep"), desc: t("userRepDesc"), icon: "🤝" },
    { title: t("userAdmin"), desc: t("userAdminDesc"), icon: "🛠️" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-12 sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
            {t("heroBadge")}
          </span>
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-ink-900 sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-xl text-base leading-7 text-ink-600 sm:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/customer/orders/new"
              className="rounded-full bg-brand-500 px-6 py-3 text-center text-sm font-bold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600"
            >
              {t("ctaOrder")}
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-ink-200 bg-white px-6 py-3 text-center text-sm font-bold text-ink-800 transition hover:border-brand-400"
            >
              {t("ctaLearnMore")}
            </a>
          </div>
          <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">
            📍 {t("coverageBadge")}
          </span>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
          {t("howItWorksTitle")}
        </h2>
        <p className="mt-2 text-ink-600">{t("howItWorksSubtitle")}</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm"
            >
              <span className="text-3xl font-black text-brand-300">{s.n}</span>
              <h3 className="mt-3 font-bold text-ink-900">{s.title}</h3>
              <p className="mt-1 text-sm leading-6 text-ink-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-ink-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-12 text-white sm:px-6">
          <span className="text-2xl">🔒</span>
          <h2 className="text-xl font-extrabold sm:text-2xl">{t("privacyTitle")}</h2>
          <p className="max-w-2xl text-ink-200">{t("privacyDesc")}</p>
        </div>
      </section>

      {/* Suppliers - Shugan */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
          {t("suppliersTitle")}
        </h2>
        <p className="mt-2 text-ink-600">{t("suppliersSubtitle")}</p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-shugan-500/20 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 ring-1 ring-ink-100">
              <Image
                src="/shugan/logo.png"
                alt={t("shuganLogoAlt")}
                width={480}
                height={746}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-ink-900">{t("shuganName")}</h3>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: "var(--color-shugan-500)" }}
                >
                  {t("shuganBadge")}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
                {t("shuganDesc")}
              </p>
            </div>
          </div>

          <div className="border-t border-ink-100 bg-ink-50/60 p-5 sm:p-8">
            <h4 className="font-bold text-ink-900">{t("shuganFleetTitle")}</h4>
            <p className="mt-1 text-sm text-ink-500">{t("shuganFleetSubtitle")}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { src: "/shugan/pump-1.jpg", alt: t("shuganFleetPump1") },
                { src: "/shugan/pump-2.jpg", alt: t("shuganFleetPump2") },
                { src: "/shugan/mixer-1.jpg", alt: t("shuganFleetMixer1") },
                { src: "/shugan/mixer-2.jpg", alt: t("shuganFleetMixer2") },
              ].map((photo) => (
                <div
                  key={photo.src}
                  className="aspect-[4/3] overflow-hidden rounded-xl bg-ink-100"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={606}
                    height={408}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Users */}
      <section className="bg-ink-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
            {t("usersTitle")}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {users.map((u) => (
              <div
                key={u.title}
                className="rounded-2xl border border-ink-100 bg-white p-5 text-center shadow-sm"
              >
                <span className="text-3xl">{u.icon}</span>
                <h3 className="mt-3 font-bold text-ink-900">{u.title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-600">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl bg-brand-500 px-6 py-10 text-white sm:px-10">
          <h2 className="text-xl font-extrabold sm:text-2xl">{t("locationTitle")}</h2>
          <p className="mt-2 max-w-xl text-brand-50">{t("locationDesc")}</p>
        </div>
      </section>
    </div>
  );
}
