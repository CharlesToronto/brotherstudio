export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_KEY = "locale";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isLocale(normalized) ? normalized : null;
}

export function getLocaleFromPathname(pathname: string | null | undefined): Locale | null {
  if (!pathname) return null;
  const [firstSegment] = pathname.split("/").filter(Boolean);
  if (!firstSegment) return null;
  return normalizeLocale(firstSegment);
}

export function stripLocaleFromPathname(
  pathname: string | null | undefined,
): string {
  if (!pathname) return "/";

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  if (isLocale(segments[0])) {
    const next = `/${segments.slice(1).join("/")}`;
    return next === "/" ? "/" : next.replace(/\/+$/, "");
  }

  return pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
}

export function withLocalePath(locale: Locale, pathname: string): string {
  const base = pathname === "/" ? "" : pathname.replace(/\/+$/, "");
  return `/${locale}${base}`;
}

export function getLanguageAlternates(pathname: string) {
  return {
    en: withLocalePath("en", pathname),
    fr: withLocalePath("fr", pathname),
    "x-default": withLocalePath(DEFAULT_LOCALE, pathname),
  };
}

export function detectPreferredLocale(acceptLanguageHeader: string | null): Locale {
  if (!acceptLanguageHeader) return DEFAULT_LOCALE;

  const candidates = acceptLanguageHeader
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [tagRaw, qRaw] = part.split(";q=");
      const tag = tagRaw.trim().toLowerCase();
      const q = qRaw ? Number.parseFloat(qRaw) : 1;
      return { tag, q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const candidate of candidates) {
    if (candidate.tag === "fr" || candidate.tag.startsWith("fr-")) return "fr";
    if (candidate.tag === "en" || candidate.tag.startsWith("en-")) return "en";
  }

  return DEFAULT_LOCALE;
}
