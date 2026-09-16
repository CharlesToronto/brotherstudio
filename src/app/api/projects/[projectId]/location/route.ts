import { NextResponse } from "next/server";

import {
  isProjectFeedbackConfigured,
  updateProjectSettings,
} from "@/lib/projectFeedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { projectId } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const address = typeof body?.address === "string" ? body.address : undefined;
  const latitude = body?.latitude === null || typeof body?.latitude === "number" ? body.latitude : undefined;
  const longitude = body?.longitude === null || typeof body?.longitude === "number" ? body.longitude : undefined;
  const mapEmbedUrl = body?.mapEmbedUrl === null || typeof body?.mapEmbedUrl === "string" ? body.mapEmbedUrl : undefined;

  try {
    const project = await updateProjectSettings(projectId, { address, latitude, longitude, mapEmbedUrl });
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update project location.";
    return NextResponse.json({ error: message }, { status: message === "Project not found." ? 404 : 400 });
  }
}
