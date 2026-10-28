import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { QuoteAcceptButton } from "@/components/orders/quote-accept-button";
import { QuoteNegotiation } from "@/components/orders/quote-negotiation";
import {
  RatingForm,
  RatingDisplay,
} from "@/components/orders/order-completion";
import { DeliveryTracker } from "@/components/orders/delivery-tracker";
import { DeliveryLoads } from "@/components/orders/delivery-loads";
import { OrderComplaints } from "@/components/orders/order-complaints";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("OrderDetail");
  const tOrder = await getTranslations("Order");
  const user = await getCurrentUser();

  const order = user
    ? await prisma.order.findUnique({
        where: { id },
        include: {
          city: true,
          district: true,
          quotes: {
            orderBy: { totalPrice: "asc" },
            include: { company: true },
          },
          ratings: true,
        },
      })
    : null;

  if (!order || order.customerId !== user?.id) {
    notFound();
  }

  const statusBadgeClass =
    order.status === "ACCEPTED" || order.status === "COMPLETED"
      ? "bg-green-100 text-green-800"
      : order.status === "CANCELLED"
        ? "bg-red-100 text-red-700"
        : "bg-ink-100 text-ink-700";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link href="/customer" className="text-sm font-semibold text-brand-700">
        {"← "}
        {t("back")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{t("title")}</h1>
          <p className="mt-1 font-mono text-sm text-ink-500">{order.code}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass}`}>
          {t("statusLabel")}: {order.status}
        </span>
      </div>

      <section className="mt-6 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-ink-600">
          <p>
            <span className="text-ink-400">{tOrder("city")}: </span>
            {order.city.name}
            {order.district ? ` — ${order.district.name}` : ""}
          </p>
          <p>
            <span className="text-ink-400">{tOrder("quantity")}: </span>
            {order.quantityM3} م³
          </p>
          <p>
            <span className="text-ink-400">{tOrder("concreteType")}: </span>
            {tOrder(`concreteTypes.${order.concreteType}` as never)}
          </p>
          <p>
            <span className="text-ink-400">{tOrder("strengthGrade")}: </span>
            {order.strengthGrade}
          </p>
          <p>
            <span className="text-ink-400">{tOrder("scheduledDate")}: </span>
            {new Date(order.scheduledAt).toLocaleString("ar-SA-u-ca-gregory-nu-latn")}
          </p>
          <p>
            <span className="text-ink-400">{tOrder("projectType")}: </span>
            {tOrder(`projectTypes.${order.projectType}` as never)}
          </p>
        </div>
        {order.notes && (
          <p className="mt-3 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">{order.notes}</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-ink-900">{t("quotesTitle")}</h2>

        {order.quotes.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-ink-200 p-8 text-center text-ink-500">
            {t("noQuotes")}
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {order.quotes.map((quote) => (
              <div
                key={quote.id}
                className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                      style={{ backgroundColor: quote.company.brandColorHex }}
                    >
                      {quote.company.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-ink-900">{quote.company.name}</p>
                      <p className="text-xs text-ink-500">
                        {t("companyRating")}:{" "}
                        {quote.company.ratingCount > 0
                          ? `${quote.company.ratingAvg.toFixed(1)} ⭐ (${quote.company.ratingCount})`
                          : t("noRating")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      quote.status === "ACCEPTED"
                        ? "bg-green-100 text-green-800"
                        : quote.status === "REJECTED" || quote.status === "WITHDRAWN"
                          ? "bg-ink-100 text-ink-500"
                          : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    {quote.status === "ACCEPTED"
                      ? t("acceptedBadge")
                      : quote.status === "PENDING"
                        ? t("pendingBadge")
                        : t("rejectedBadge")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink-600">
                  <p>
                    <span className="text-ink-400">{t("pricePerM3")}: </span>
                    {quote.pricePerM3.toLocaleString()} ر.س
                  </p>
                  {quote.pumpPrice != null && (
                    <p>
                      <span className="text-ink-400">{t("pumpPrice")}: </span>
                      {quote.pumpPrice.toLocaleString()} ر.س
                    </p>
                  )}
                </div>
                <p className="mt-2 text-lg font-black text-ink-900">
                  {t("totalPrice")}: {quote.totalPrice.toLocaleString()} ر.س
                </p>
                {quote.notes && (
                  <p className="mt-2 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">
                    {quote.notes}
                  </p>
                )}

                {(quote.status === "PENDING" || quote.status === "ACCEPTED") && (
                  <QuoteNegotiation quoteId={quote.id} />
                )}

                {quote.status === "PENDING" && order.status !== "ACCEPTED" && (
                  <div className="mt-4 flex justify-end">
                    <QuoteAcceptButton quoteId={quote.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {(order.status === "ACCEPTED" || order.status === "COMPLETED") && (
        <div className="mt-8 space-y-5">
          <DeliveryLoads orderId={order.id} />
          <DeliveryTracker orderId={order.id} />
        </div>
      )}

      {(order.status === "ACCEPTED" || order.status === "COMPLETED") && <OrderComplaints orderId={order.id} />}

      {order.status === "COMPLETED" && (
        <section className="mt-8">
          {order.ratings.length > 0 ? (
            <RatingDisplay stars={order.ratings[0].stars} comment={order.ratings[0].comment} />
          ) : (
            <RatingForm orderId={order.id} />
          )}
        </section>
      )}
    </div>
  );
}
