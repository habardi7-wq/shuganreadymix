import type { Metadata, Viewport } from "next";
import { Cairo, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { PwaInstaller } from "@/components/pwa-installer";
import "../globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#31547f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Brand" });
  return {
    title: `${t("name")} | ${t("tagline")}`,
    description: t("tagline"),
    manifest: "/manifest.webmanifest",
    applicationName: t("name"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("name"),
    },
    icons: {
      icon: "/brand/kharasana-pro-icon.png",
      apple: "/brand/kharasana-pro-icon.png",
    },
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const user = await getCurrentUser();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${cairo.variable} ${inter.variable} h-full`}>
      <body className="flex h-full min-h-screen flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          <SiteHeader
            user={
              user ? { role: user.role, name: user.name, status: user.status } : null
            }
          />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <WhatsAppButton />
          <PwaInstaller />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
