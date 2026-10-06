import { NextRequest, NextResponse } from "next/server";

import { ANALYTICS_EXCLUSION_COOKIE } from "@/lib/analyticsPreference";

export async function GET(request: NextRequest) {
  const tracking = request.nextUrl.searchParams.get("tracking");
  if (tracking !== "off" && tracking !== "on") {
    return NextResponse.json({ error: "Use tracking=off or tracking=on." }, { status: 400 });
  }

  // A full navigation ensures the root layout reads the updated preference.
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set({
    name: ANALYTICS_EXCLUSION_COOKIE,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: tracking === "off" ? 60 * 60 * 24 * 365 : 0,
  });
  return response;
}
