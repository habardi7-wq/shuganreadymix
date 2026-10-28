import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

const copy = {
  ar: {
    title: "دليل مصانع الخرسانة",
    subtitle: "قارن المصانع المعتمدة ومناطق الخدمة والتقييم قبل إرسال طلبك.",
    search: "ابحث باسم المصنع",
    city: "كل المدن",
    apply: "بحث",
    featured: "مصنع مميز",
    verified: "موثّق",
    rating: "التقييم",
    areas: "مناطق الخدمة",
    details: "عرض ملف المصنع",
    order: "اطلب عرض سعر",
    empty: "لا توجد مصانع مطابقة حالياً.",
  },
  en: {
    title: "Ready-mix factory directory",
    subtitle: "Compare verified factories, service areas and ratings before requesting quotes.",
    search: "Search factory name",
    city: "All cities",
    apply: "Search",
    featured: "Featured factory",
    verified: "Verified",
    rating: "Rating",
    areas: "Service areas",
    details: "View factory",
    order: "Request quotes",
    empty: "No matching factories found.",
  },
};

export default async function FactoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  const { locale } = await params;
  const t = locale === "en" ? copy.en : copy.ar;
  const filters = await searchParams;
  const q = filters.q?.trim() ?? "";
  const cityId = filters.city?.trim() ?? "";

  const [cities, factories] = await Promise.all([
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.company.findMany({
      where: {
        status: "APPROVED",
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { nameEn: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(cityId
          ? { serviceAreas: { some: { cityId } } }
          : {}),
      },
      include: {
        serviceAreas: {
          include: { city: true, district: true },
          orderBy: { city: { name: "asc" } },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { ratingAvg: "desc" }, { name: "asc" }],
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:p-10">
        <h1 className="text-3xl font-black sm:text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-2xl text-brand-50">{t.subtitle}</p>
        <form className="mt-6 grid gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur sm:grid-cols-[1fr_220px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder={t.search}
            className="rounded-xl border border-white/20 bg-white px-4 py-3 text-ink-900 outline-none"
          />
          <select
            name="city"
            defaultValue={cityId}
            className="rounded-xl border border-white/20 bg-white px-4 py-3 text-ink-900 outline-none"
          >
            <option value="">{t.city}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {locale === "en" ? city.nameEn : city.name}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-ink-900 px-6 py-3 font-bold text-white">{t.apply}</button>
        </form>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {factories.map((factory) => {
          const areaNames = [...new Set(factory.serviceAreas.map((area) =>
            locale === "en" ? area.city.nameEn : area.city.name
          ))];
          return (
            <article key={factory.id} className="flex flex-col rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white"
                  style={{ backgroundColor: factory.brandColorHex }}
                >
                  {factory.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {factory.isFeatured && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{t.featured}</span>}
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">✓ {t.verified}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-extrabold text-ink-900">{locale === "en" && factory.nameEn ? factory.nameEn : factory.name}</h2>
                </div>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-ink-600">
                {(locale === "en" ? factory.descriptionEn : factory.description) || factory.description || "—"}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-ink-50 p-3">
                  <dt className="text-xs text-ink-500">{t.rating}</dt>
                  <dd className="mt-1 font-bold text-ink-900">★ {factory.ratingAvg.toFixed(1)} ({factory.ratingCount})</dd>
                </div>
                <div className="rounded-xl bg-ink-50 p-3">
                  <dt className="text-xs text-ink-500">{t.areas}</dt>
                  <dd className="mt-1 truncate font-bold text-ink-900">{areaNames.join("، ") || "—"}</dd>
                </div>
              </dl>

              <div className="mt-auto flex gap-2 pt-5">
                <Link href={`/factories/${factory.slug}`} className="flex-1 rounded-xl border border-ink-200 px-3 py-2 text-center text-sm font-bold text-ink-800">
                  {t.details}
                </Link>
                <Link href="/customer/orders/new" className="flex-1 rounded-xl bg-brand-500 px-3 py-2 text-center text-sm font-bold text-white">
                  {t.order}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {factories.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-ink-200 p-10 text-center text-ink-500">{t.empty}</div>
      )}
    </main>
  );
}
