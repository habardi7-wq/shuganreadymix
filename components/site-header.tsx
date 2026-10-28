"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";

interface HeaderUser {
  role: string;
  name: string | null;
  status: string;
}

const DASHBOARD_PATH: Record<string, string> = {
  CUSTOMER: "/customer",
  COMPANY: "/company",
  SALES_REP: "/rep",
  ADMIN: "/admin",
};

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const tBrand = useTranslations("Brand");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-ink-900">
          <Image
            src="/brand/kharasana-pro-icon.png"
            alt=""
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-xl"
          />
          <span className="text-lg">{tBrand("name")}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium text-ink-700 hover:text-brand-700">
            {t("home")}
          </Link>
          <Link href="/factories" className="text-sm font-medium text-ink-700 hover:text-brand-700">
            {locale === "en" ? "Factories" : "دليل المصانع"}
          </Link>
          <Link href="/price-index" className="text-sm font-medium text-ink-700 hover:text-brand-700">
            {locale === "en" ? "Price index" : "مؤشر الأسعار"}
          </Link>
          {user?.role === "CUSTOMER" && (
            <Link
              href="/customer/orders/new"
              className="text-sm font-medium text-ink-700 hover:text-brand-700"
            >
              {t("newOrder")}
            </Link>
          )}
          {user && (
            <Link
              href={DASHBOARD_PATH[user.role] ?? "/"}
              className="text-sm font-medium text-ink-700 hover:text-brand-700"
            >
              {t("dashboard")}
            </Link>
          )}
          <LocaleSwitcher />
          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
            >
              {t("logout")}
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              {t("login")}
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
          aria-expanded={open}
        >
          <span className="sr-only">menu</span>
          <div className="flex flex-col gap-1">
            <span className="h-0.5 w-5 bg-ink-800" />
            <span className="h-0.5 w-5 bg-ink-800" />
            <span className="h-0.5 w-5 bg-ink-800" />
          </div>
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/" onClick={() => setOpen(false)} className="py-1 text-ink-800">
              {t("home")}
            </Link>
            <Link href="/factories" onClick={() => setOpen(false)} className="py-1 text-ink-800">
              {locale === "en" ? "Factories" : "دليل المصانع"}
            </Link>
            <Link href="/price-index" onClick={() => setOpen(false)} className="py-1 text-ink-800">
              {locale === "en" ? "Price index" : "مؤشر الأسعار"}
            </Link>
            {user?.role === "CUSTOMER" && (
              <Link
                href="/customer/orders/new"
                onClick={() => setOpen(false)}
                className="py-1 text-ink-800"
              >
                {t("newOrder")}
              </Link>
            )}
            {user && (
              <Link
                href={DASHBOARD_PATH[user.role] ?? "/"}
                onClick={() => setOpen(false)}
                className="py-1 text-ink-800"
              >
                {t("dashboard")}
              </Link>
            )}
            <div className="flex items-center justify-between pt-2">
              <LocaleSwitcher />
              {user ? (
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("logout")}
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
