import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getProjectViewerCookieName,
  getProjectViewerRoleCookieName,
  isProjectFeedbackConfigured,
  updateProjectSettings,
  canProjectViewerEditSharedMap,
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
  const cookieStore = await cookies();
  const canEdit = await canProjectViewerEditSharedMap({
    projectId,
    viewerRole: cookieStore.get(getProjectViewerRoleCookieName(projectId))?.value,
    viewerEmail: cookieStore.get(getProjectViewerCookieName(projectId))?.value,
  });

  if (!canEdit) {
    return NextResponse.json({ error: "Project access is required to update the map." }, { status: 403 });
  }

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
