import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSession, hasAdminSession } from "@/lib/adminSession";

export async function GET() {
  return NextResponse.json({ authorized: await hasAdminSession() }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  const body = await request.json().catch(() => null);
  // Retains the existing admin code; the new session is verified on the server.
  if (body?.code !== (process.env.ADMIN_ACCESS_CODE || "1870")) return NextResponse.json({ error: "Code incorrect." }, { status: 403 });
  const response = NextResponse.json({ authorized: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(), { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "strict", path: "/", maxAge: 86400 });
  return response;
}
