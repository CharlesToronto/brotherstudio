import { createHash } from "node:crypto";
import { ANALYTICS_EXCLUSION_COOKIE } from "@/lib/analyticsPreference";
import { isPublicTrackingPath, META_PIXEL_ID } from "@/lib/metaPixel";

export async function sendMetaLead(request: Request, lead: { eventId: string; formName: string; email: string }) {
  const token = process.env.META_CONVERSIONS_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_API_VERSION;
  if (process.env.NODE_ENV !== "production" || !token || !version || !/^v\d+\.0$/.test(version)) return;
  const cookies = new Map((request.headers.get("cookie") ?? "").split(";").map(value => {
    const index = value.indexOf("=");
    return [value.slice(0, index).trim(), value.slice(index + 1)];
  }));
  if (cookies.get(ANALYTICS_EXCLUSION_COOKIE) === "1") return;
  try {
    const source = new URL(request.headers.get("referer") ?? "");
    if (source.origin !== new URL(request.url).origin || !isPublicTrackingPath(source.pathname)) return;
    source.search = "";
    source.hash = "";
    const response = await fetch(`https://graph.facebook.com/${version}/${META_PIXEL_ID}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        data: [{
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: lead.eventId,
          action_source: "website",
          event_source_url: source.toString(),
          user_data: {
            em: [createHash("sha256").update(lead.email.trim().toLowerCase()).digest("hex")],
            client_user_agent: request.headers.get("user-agent") ?? undefined,
            fbp: cookies.get("_fbp") || undefined,
            fbc: cookies.get("_fbc") || undefined,
          },
          custom_data: { form_name: lead.formName },
        }],
        ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
      }),
    });
    if (!response.ok) console.error("Meta Lead delivery failed", response.status);
  } catch { console.error("Meta Lead delivery failed; contact request remains saved."); }
}
