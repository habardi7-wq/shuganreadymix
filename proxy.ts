import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { REFERRAL_COOKIE } from "@/lib/referral";
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

  let response: NextResponse;

  if (requiredRole && !isAdminLoginPage) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const payload = token ? await verifySessionToken(token) : null;

    if (!payload || payload.role !== requiredRole) {
      const loginPath =
        requiredRole === "ADMIN" ? `/${locale}/admin/login` : `/${locale}/auth/login`;
      const url = req.nextUrl.clone();
      url.pathname = loginPath;
      url.searchParams.set("next", pathname);
      response = NextResponse.redirect(url);
      return applyReferralCookie(req, response);
    }
  }

  response = await intlMiddleware(req);
  return applyReferralCookie(req, response);
}

// A sales-rep referral link (e.g. /?ref=KP-DEMO001) drops a 30-day cookie so
// that whichever order the visitor eventually creates can be attributed back
// to the rep (see referredByRepId on Order, read in app/api/orders/route.ts).
function applyReferralCookie(req: NextRequest, response: NextResponse) {
  const refCode = req.nextUrl.searchParams.get("ref");
  if (refCode && /^[A-Za-z0-9-]{3,32}$/.test(refCode)) {
    response.cookies.set(REFERRAL_COOKIE, refCode, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
