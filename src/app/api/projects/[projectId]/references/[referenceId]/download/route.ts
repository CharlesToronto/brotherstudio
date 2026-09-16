import { NextResponse } from "next/server";

import { isProjectFeedbackConfigured } from "@/lib/projectFeedbackStore";
import { getProjectReferenceDownloadAsset } from "@/lib/projectReferenceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; referenceId: string }> },
) {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const { projectId, referenceId } = await params;
    const asset = await getProjectReferenceDownloadAsset(projectId, referenceId);
    const upstream = await fetch(asset.url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) throw new Error("Failed to fetch reference asset.");

    return new NextResponse(upstream.body, {
      headers: {
        "content-type": asset.mimeType,
        "content-disposition": `attachment; filename="${asset.filename.replace(/"/g, "")}"`,
        "cache-control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to download reference.";
    return NextResponse.json({ error: message }, { status: message === "Reference file not found." ? 404 : 400 });
  }
}
