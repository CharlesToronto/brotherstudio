const FALLBACK_SITE_URL = "https://brotherstudio.ca";

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    FALLBACK_SITE_URL,
  ];

  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const normalized = normalizeSiteUrl(raw);
    if (!normalized) continue;

    try {
      return new URL(normalized);
    } catch {}
  }

  return new URL(FALLBACK_SITE_URL);
}

export function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, getSiteUrl()).toString();
}
