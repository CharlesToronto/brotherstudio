import { cookies, headers } from "next/headers";

import {
  LOCALE_COOKIE_KEY,
  detectPreferredLocale,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";

export async function getPreferredRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value ?? null);
  if (cookieLocale) return cookieLocale;

  const headerStore = await headers();
  return detectPreferredLocale(headerStore.get("accept-language"));
}
