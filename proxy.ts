import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import type { Role } from "@/lib/enums";

const intlMiddleware = createIntlMiddleware(routing);

// First path segment (after the locale) -> role required to access it.
const PROTECTED_PREFIXES: Record<string, Role> = {
  customer: "CUSTOMER",
  company: "COMPANY",
  rep: "SALES_REP",
  admin: "ADMIN",
};

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const segments = pathname.split("/").filter(Boolean);
  const locale = routing.locales.includes(segments[0] as (typeof routing.locales)[number])
    ? segments[0]
    : routing.defaultLocale;
  const section = routing.locales.includes(segments[0] as (typeof routing.locales)[number])
    ? segments[1]
    : segments[0];

  const requiredRole = section ? PROTECTED_PREFIXES[section] : undefined;

  // Admin login page itself must stay reachable without a session.
  const isAdminLoginPage = section === "admin" && segments.at(-1) === "login";

  if (requiredRole && !isAdminLoginPage) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const payload = token ? await verifySessionToken(token) : null;

    if (!payload || payload.role !== requiredRole) {
      const loginPath =
        requiredRole === "ADMIN" ? `/${locale}/admin/login` : `/${locale}/auth/login`;
      const url = req.nextUrl.clone();
      url.pathname = loginPath;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
