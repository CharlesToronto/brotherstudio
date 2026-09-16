const GOOGLE_MAPS_EMBED_PATH = "/maps/embed";

function extractIframeSource(value: string) {
  const match = value.match(
    /<iframe\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i,
  );

  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? value).replace(/&amp;/g, "&").trim();
}

function isGoogleMapsHost(hostname: string) {
  return (
    hostname === "maps.google.com" ||
    hostname === "www.google.com" ||
    /^www\.google\.[a-z.]+$/i.test(hostname)
  );
}

export function normalizeGoogleMapsEmbedUrl(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("A Google Maps embed link is required.");
  }

  const candidate = extractIframeSource(value);
  if (!candidate) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(candidate);
  } catch {
    throw new Error("Paste a valid Google Maps embed link or iframe code.");
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !isGoogleMapsHost(parsedUrl.hostname.toLowerCase()) ||
    !parsedUrl.pathname.startsWith(GOOGLE_MAPS_EMBED_PATH)
  ) {
    throw new Error("The link must come from Google Maps Embed.");
  }

  return parsedUrl.toString();
}
