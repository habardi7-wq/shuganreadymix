import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export default async function CustomerDashboardPage() {
  const t = await getTranslations("Dashboard");
  const tOrder = await getTranslations("Order");
  const user = await getCurrentUser();

  const orders = user
    ? await prisma.order.findMany({
        where: { customerId: user.id },
        include: { city: true, district: true, quotes: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{t("customerTitle")}</h1>
          <p className="mt-1 text-ink-600">
            {t("customerWelcome")} {user?.name}
          </p>
        </div>
        <Link
          href="/customer/orders/new"
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white"
        >
          {tOrder("title")}
        </Link>
      </div>

      <div className="mt-8">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 p-8 text-center text-ink-500">
            {t("customerEmpty")}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/customer/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition hover:border-brand-300"
                >
                  <div>
                    <p className="font-bold text-ink-900">{o.code}</p>
                    <p className="text-sm text-ink-500">
                      {o.city.name}
                      {o.district ? ` — ${o.district.name}` : ""} · {o.quantityM3} م³
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700">
                      {o.status}
                    </span>
                    <span className="text-xs text-ink-400">{o.quotes.length} عروض</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
