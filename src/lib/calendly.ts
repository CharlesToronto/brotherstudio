export const CALENDLY_MEETING_URL = "https://calendly.com/brotherstudio-info/30min";

export function buildCalendlyEmbedUrl(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}hide_gdpr_banner=1`;
}
