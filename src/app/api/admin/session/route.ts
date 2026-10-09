import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";

export async function GET() {
  return NextResponse.json({ authorized: await hasAdminSession() }, { headers: { "Cache-Control": "no-store" } });
}
export { POST } from "@/app/api/estate/session/route";
