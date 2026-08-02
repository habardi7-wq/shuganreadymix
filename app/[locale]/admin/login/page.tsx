import { getTranslations } from "next-intl/server";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export default async function AdminLoginPage() {
  const t = await getTranslations("AdminLogin");

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <h1 className="text-center text-2xl font-extrabold text-ink-900">{t("title")}</h1>
      <p className="mt-2 text-center text-sm text-ink-600">{t("subtitle")}</p>
      <div className="mt-8">
        <AdminLoginForm />
      </div>
    </div>
  );
}
