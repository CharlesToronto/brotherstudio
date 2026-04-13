import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  canProjectViewerInteract,
  canProjectViewerRead,
  getProjectAccessCookieName,
  getProjectViewerCookieName,
  getProjectViewerRoleCookieName,
  isProjectFeedbackConfigured,
  listProjectImageDrawingLayer,
  saveProjectImageDrawingLayer,
} from "@/lib/projectFeedbackStore";
import type { ProjectFeedbackDrawingElement } from "@/lib/projectFeedbackTypes";

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
  const cookieStore = await cookies();
  const isAuthorized = await canProjectViewerRead(
    projectId,
    cookieStore.get(getProjectViewerCookieName(projectId))?.value,
  );

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Open the project with your email to view the drawing layer." },
      { status: 403 },
    );
  }

  try {
    const layer = await listProjectImageDrawingLayer(projectId, imageId);
    return NextResponse.json({ layer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load drawings.";
    const status = message === "Image not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: Request,
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
  const cookieStore = await cookies();
  const isAuthorized = await canProjectViewerInteract({
    projectId,
    password: cookieStore.get(getProjectAccessCookieName(projectId))?.value,
    viewerRole: cookieStore.get(getProjectViewerRoleCookieName(projectId))?.value,
    viewerEmail: cookieStore.get(getProjectViewerCookieName(projectId))?.value,
  });

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Team member access is required to edit drawings." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        viewerEmail?: unknown;
        elements?: unknown;
      }
    | null;

  const viewerEmail =
    cookieStore.get(getProjectViewerCookieName(projectId))?.value ??
    (typeof body?.viewerEmail === "string" ? body.viewerEmail : "");
  const elements = Array.isArray(body?.elements)
    ? (body.elements as ProjectFeedbackDrawingElement[])
    : [];

  try {
    const layer = await saveProjectImageDrawingLayer({
      projectId,
      imageId,
      viewerEmail,
      elements,
    });
    return NextResponse.json({ layer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save drawings.";
    const status = message === "Image not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
