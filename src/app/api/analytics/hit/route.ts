import { NextRequest, NextResponse } from "next/server";

import {
  isTrackablePath,
  normalizeAnalyticsPath,
  recordPageView,
} from "@/lib/analyticsStore";

export const runtime = "nodejs";

const VISITOR_COOKIE_KEY = "bs_visitor_id";
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

async function readBody(request: Request) {
  try {
    const raw = await request.text();
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await readBody(request);
  const rawPath = (body as { path?: unknown } | null)?.path;
  const path = normalizeAnalyticsPath(typeof rawPath === "string" ? rawPath : "/");

  const response = NextResponse.json({ ok: true }, { status: 202 });
  if (!isTrackablePath(path)) return response;

  let visitorId = request.cookies.get(VISITOR_COOKIE_KEY)?.value ?? "";
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    response.cookies.set({
      name: VISITOR_COOKIE_KEY,
      value: visitorId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
    });
  }

  await recordPageView({ path, visitorId });
  return response;
}
