import { getTranslations } from "next-intl/server";
import { OrderForm } from "@/components/orders/order-form";

export default async function NewOrderPage() {
  const t = await getTranslations("Order");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-extrabold text-ink-900">{t("title")}</h1>
      <p className="mt-2 text-ink-600">{t("subtitle")}</p>
      <div className="mt-8">
        <OrderForm />
      </div>
    </div>
  );
}
