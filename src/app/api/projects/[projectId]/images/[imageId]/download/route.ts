import { NextResponse } from "next/server";

import {
  getProjectImageDownloadAsset,
  isProjectFeedbackConfigured,
} from "@/lib/projectFeedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ projectId: string; imageId: string }> },
) {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 },
    );
  }

  const { projectId, imageId } = await params;

  try {
    const asset = await getProjectImageDownloadAsset(projectId, imageId);
    const upstream = await fetch(asset.url, { cache: "no-store" });

    if (!upstream.ok || !upstream.body) {
      throw new Error("Failed to fetch image asset.");
    }

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-disposition": `attachment; filename="${asset.filename}"`,
        "cache-control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to download image.";
    const status =
      message === "Project not found."
        ? 404
        : message === "Image not found."
          ? 404
          : message === "Image is not approved for download."
            ? 403
            : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
