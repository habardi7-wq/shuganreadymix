import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export default async function FactoryProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isEnglish = locale === "en";
  const factory = await prisma.company.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      serviceAreas: {
        include: { city: true, district: true },
        orderBy: { city: { name: "asc" } },
      },
      ratings: {
        select: { stars: true, comment: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!factory) notFound();

  const labels = isEnglish
    ? {
        verified: "Verified supplier",
        featured: "Featured",
        rating: "Customer rating",
        areas: "Service areas",
        reviews: "Latest reviews",
        noReviews: "No written reviews yet.",
        request: "Request a quote from factories",
        back: "Back to directory",
      }
    : {
        verified: "مورد موثّق",
        featured: "مصنع مميز",
        rating: "تقييم العملاء",
        areas: "مناطق الخدمة",
        reviews: "أحدث التقييمات",
        noReviews: "لا توجد تقييمات مكتوبة حتى الآن.",
        request: "اطلب عروض أسعار من المصانع",
        back: "العودة إلى الدليل",
      };

  const name = isEnglish && factory.nameEn ? factory.nameEn : factory.name;
  const description =
    (isEnglish ? factory.descriptionEn : factory.description) ||
    factory.description ||
    "";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/factories" className="text-sm font-bold text-brand-700">← {labels.back}</Link>

      <section className="mt-5 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        <div className="h-32" style={{ background: `linear-gradient(135deg, ${factory.brandColorHex}, #111827)` }} />
        <div className="-mt-10 p-6 sm:p-8">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white text-3xl font-black text-white shadow"
            style={{ backgroundColor: factory.brandColorHex }}
          >
            {name.slice(0, 1)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black text-ink-900">{name}</h1>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">✓ {labels.verified}</span>
            {factory.isFeatured && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{labels.featured}</span>}
          </div>
          <p className="mt-4 max-w-3xl leading-7 text-ink-600">{description}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-ink-50 p-5">
              <p className="text-sm text-ink-500">{labels.rating}</p>
              <p className="mt-2 text-2xl font-black text-ink-900">★ {factory.ratingAvg.toFixed(1)}</p>
              <p className="text-sm text-ink-500">{factory.ratingCount} {isEnglish ? "ratings" : "تقييم"}</p>
            </div>
            <div className="rounded-2xl bg-ink-50 p-5">
              <p className="text-sm text-ink-500">{labels.areas}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {factory.serviceAreas.map((area) => (
                  <span key={area.id} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink-800">
                    {isEnglish ? area.city.nameEn : area.city.name}
                    {area.district ? ` · ${isEnglish ? area.district.nameEn : area.district.name}` : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Link href="/customer/orders/new" className="mt-6 inline-flex rounded-xl bg-brand-500 px-6 py-3 font-bold text-white">
            {labels.request}
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-ink-900">{labels.reviews}</h2>
        <div className="mt-4 grid gap-3">
          {factory.ratings.map((rating) => (
            <article key={rating.createdAt.toISOString()} className="rounded-2xl border border-ink-100 bg-white p-5">
              <p className="font-bold text-amber-500">{"★".repeat(rating.stars)}{"☆".repeat(5 - rating.stars)}</p>
              {rating.comment && <p className="mt-2 text-sm leading-6 text-ink-700">{rating.comment}</p>}
              <time className="mt-2 block text-xs text-ink-400">{rating.createdAt.toLocaleDateString(isEnglish ? "en-SA" : "ar-SA")}</time>
            </article>
          ))}
          {factory.ratings.length === 0 && <p className="rounded-2xl bg-ink-50 p-6 text-ink-500">{labels.noReviews}</p>}
        </div>
      </section>
    </main>
  );
}
