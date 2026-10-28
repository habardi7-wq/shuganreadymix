import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const t = await getTranslations("Auth");
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <h1 className="text-center text-2xl font-extrabold text-ink-900">{t("loginTitle")}</h1>
      <p className="mt-2 text-center text-sm text-ink-600">{t("loginSubtitle")}</p>
      <div className="mt-8">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
