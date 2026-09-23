import { NextResponse } from "next/server";

import { processPendingProjectCommentDigests } from "@/lib/projectNotifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const processed = await processPendingProjectCommentDigests();
    return NextResponse.json({ processed });
  } catch (error) {
    console.error("Failed to process project notification digests:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process notifications." },
      { status: 500 },
    );
  }
}
