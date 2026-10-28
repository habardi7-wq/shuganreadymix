import { prisma } from "@/lib/prisma";
import { buildVerifiedPriceIndex } from "@/lib/price-index";
import { STRENGTH_GRADES } from "@/lib/enums";

const labels = {
  ar: {
    title: "مؤشر أسعار الخرسانة الموثّق",
    subtitle: "بيانات آلية من عمليات مكتملة داخل خرسانة برو، بدون كشف العميل أو المصنع.",
    city: "كل المدن",
    grade: "كل درجات المقاومة",
    apply: "عرض المؤشر",
    average: "متوسط سعر المتر",
    median: "السعر الوسيط",
    range: "النطاق",
    samples: "عمليات موثقة",
    change: "التغير الشهري",
    history: "السجل الشهري",
    privacy: "لا ننشر أي مجموعة تقل عن 3 عمليات حفاظاً على الخصوصية ودقة المؤشر.",
    empty: "لا توجد عينة كافية لهذه الخيارات حتى الآن. سيظهر المؤشر آلياً بعد اكتمال 3 عمليات موثقة على الأقل.",
    sar: "ر.س/م³",
  },
  en: {
    title: "Verified concrete price index",
    subtitle: "Automatically calculated from completed Kharasana Pro transactions without exposing customers or factories.",
    city: "All cities",
    grade: "All strength grades",
    apply: "View index",
    average: "Average price",
    median: "Median price",
    range: "Range",
    samples: "Verified transactions",
    change: "Monthly change",
    history: "Monthly history",
    privacy: "Groups with fewer than 3 transactions are not published for privacy and accuracy.",
    empty: "There is not enough data for these filters yet. The index appears automatically after at least 3 verified transactions.",
    sar: "SAR/m³",
  },
};

export default async function PriceIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string; grade?: string }>;
}) {
  const { locale } = await params;
  const isEnglish = locale === "en";
  const t = isEnglish ? labels.en : labels.ar;
  const filters = await searchParams;
  const cityId = filters.city?.trim() ?? "";
  const grade = filters.grade?.trim() ?? "";

  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 18);

  const [cities, orders] = await Promise.all([
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.order.findMany({
      where: {
        status: "COMPLETED",
        updatedAt: { gte: since },
        acceptedQuoteId: { not: null },
        ...(cityId ? { cityId } : {}),
        ...(grade && STRENGTH_GRADES.includes(grade as (typeof STRENGTH_GRADES)[number])
          ? { strengthGrade: grade }
          : {}),
      },
      select: {
        updatedAt: true,
        acceptedQuote: { select: { pricePerM3: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 5000,
    }),
  ]);

  const points = buildVerifiedPriceIndex(
    orders.flatMap((order) =>
      order.acceptedQuote
        ? [{ pricePerM3: order.acceptedQuote.pricePerM3, completedAt: order.updatedAt }]
        : []
    )
  );
  const latest = points.at(-1);
  const chartMaximum = Math.max(...points.map((point) => point.average), 1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-3xl bg-ink-900 p-6 text-white sm:p-10">
        <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-200">✓ {isEnglish ? "Verified transactions only" : "عمليات مكتملة فقط"}</span>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-ink-200">{t.subtitle}</p>

        <form className="mt-6 grid gap-3 rounded-2xl bg-white/10 p-3 sm:grid-cols-[1fr_1fr_auto]">
          <select name="city" defaultValue={cityId} className="rounded-xl bg-white px-4 py-3 text-ink-900">
            <option value="">{t.city}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>{isEnglish ? city.nameEn : city.name}</option>
            ))}
          </select>
          <select name="grade" defaultValue={grade} className="rounded-xl bg-white px-4 py-3 text-ink-900">
            <option value="">{t.grade}</option>
            {STRENGTH_GRADES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="rounded-xl bg-brand-500 px-6 py-3 font-bold text-white">{t.apply}</button>
        </form>
      </section>

      {latest ? (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              [t.average, `${latest.average.toLocaleString()} ${t.sar}`],
              [t.median, `${latest.median.toLocaleString()} ${t.sar}`],
              [t.range, `${latest.minimum.toLocaleString()}–${latest.maximum.toLocaleString()}`],
              [t.samples, latest.sampleSize.toLocaleString()],
              [t.change, latest.changePercent == null ? "—" : `${latest.changePercent > 0 ? "+" : ""}${latest.changePercent}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-ink-500">{label}</p>
                <p className="mt-2 text-xl font-black text-ink-900">{value}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-extrabold text-ink-900">{t.history}</h2>
            <div className="mt-6 space-y-4">
              {points.map((point) => (
                <div key={point.month} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 text-sm">
                  <span className="font-bold text-ink-600">{point.month}</span>
                  <div className="h-9 overflow-hidden rounded-lg bg-ink-50">
                    <div
                      className="flex h-full items-center rounded-lg bg-gradient-to-l from-brand-500 to-brand-300 px-3 font-bold text-white"
                      style={{ width: `${Math.max(12, (point.average / chartMaximum) * 100)}%` }}
                    >
                      {point.average}
                    </div>
                  </div>
                  <span className="text-xs text-ink-500">{point.sampleSize} {isEnglish ? "orders" : "طلبات"}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-ink-200 bg-ink-50 p-10 text-center text-ink-600">{t.empty}</div>
      )}

      <p className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">🔒 {t.privacy}</p>
    </main>
  );
}
