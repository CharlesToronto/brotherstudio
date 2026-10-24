import { ANALYTICS_EXCLUSION_COOKIE } from "@/lib/analyticsPreference";

export const META_PIXEL_ID = "1625433562404303";
type Parameters = Record<string, string | number | string[]>;
type PixelWindow = Window & { fbq?: (command: string, event: string, parameters?: Parameters, options?: { eventID: string }) => void };

export function isPublicTrackingPath(path: string) {
  const route = path.replace(/^\/(fr|en)(?=\/|$)/, "");
  return !/^\/(admin|dashboard|team|myreview|myexperience|api)(\/|$)/.test(route);
}

export function metaTrackingEnabled() {
  return typeof window !== "undefined" && process.env.NODE_ENV === "production"
    && isPublicTrackingPath(window.location.pathname)
    && !document.cookie.split(";").some(cookie => cookie.trim() === `${ANALYTICS_EXCLUSION_COOKIE}=1`);
}

export function trackMeta(event: string, parameters: Parameters = {}, eventId?: string, custom = false) {
  if (!metaTrackingEnabled()) return;
  try {
    (window as PixelWindow).fbq?.(custom ? "trackCustom" : "track", event, parameters, eventId ? { eventID: eventId } : undefined);
  } catch { /* Tracking must never interrupt the visitor's action. */ }
}

// Only the server can acknowledge a real lead; honeypot responses carry no event ID.
export async function submitTrackedContact(body: Record<string, unknown>) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.ok) {
    const result = await response.clone().json().catch(() => null);
    if (result?.ok && typeof result.metaEventId === "string") {
      trackMeta("Lead", { form_name: result.metaFormName }, result.metaEventId);
    }
  }
  return response;
}
