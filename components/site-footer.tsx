import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Home");
  const tBrand = useTranslations("Brand");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-100 bg-ink-900 text-ink-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-extrabold text-white">
              <Image
                src="/brand/kharasana-pro-icon.png"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl"
              />
              <span>{tBrand("name")}</span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-ink-300">{tBrand("tagline")}</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-200">
            <Link href="/" className="hover:text-white">
              {t("ctaLearnMore")}
            </Link>
            <Link href="/auth/login" className="hover:text-white">
              {t("userCustomer")}
            </Link>
            <Link href="/admin/login" className="hover:text-white">
              {t("userAdmin")}
            </Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-ink-800 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {tBrand("name")} — {t("footerRights")}
          </p>
          <p>{t("footerDemo")}</p>
        </div>
      </div>
    </footer>
  );
}
