import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE_KEY, getLocaleFromPathname } from "@/lib/i18n";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const PUBLIC_FILE_PATTERN = /\.[^/]+$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    PUBLIC_FILE_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  const locale = getLocaleFromPathname(pathname);
  if (!locale) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site-locale", locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set({
    name: LOCALE_COOKIE_KEY,
    value: locale,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
  });

  return response;
}
