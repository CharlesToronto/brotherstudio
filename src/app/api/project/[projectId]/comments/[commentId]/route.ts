import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  canProjectViewerInteract,
  deleteProjectComment,
  getProjectAccessCookieName,
  getProjectViewerCookieName,
  getProjectViewerRoleCookieName,
  isProjectFeedbackConfigured,
  updateProjectComment,
} from "@/lib/projectFeedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireTeamAccess(projectId: string) {
  const cookieStore = await cookies();
  const isAuthorized = await canProjectViewerInteract({
    projectId,
    password: cookieStore.get(getProjectAccessCookieName(projectId))?.value,
    viewerRole: cookieStore.get(getProjectViewerRoleCookieName(projectId))?.value,
    viewerEmail: cookieStore.get(getProjectViewerCookieName(projectId))?.value,
  });

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Team member access is required to update edit requests." },
      { status: 403 },
    );
  }

  return null;
}

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ projectId: string; commentId: string }> },
) {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 },
    );
  }

  const { projectId, commentId } = await params;
  const unauthorizedResponse = await requireTeamAccess(projectId);
  if (unauthorizedResponse) return unauthorizedResponse;

  const body = (await request.json().catch(() => null)) as
    | {
        content?: unknown;
        color?: unknown;
      }
    | null;

  const content = typeof body?.content === "string" ? body.content : "";
  const color = typeof body?.color === "string" ? body.color : undefined;

  try {
    const project = await updateProjectComment({
      projectId,
      commentId,
      content,
      color,
    });

    return NextResponse.json({ project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update edit request.";
    const status = message === "Edit request not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ projectId: string; commentId: string }> },
) {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 },
    );
  }

  const { projectId, commentId } = await params;
  const unauthorizedResponse = await requireTeamAccess(projectId);
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const project = await deleteProjectComment(projectId, commentId);
    return NextResponse.json({ project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete edit request.";
    const status = message === "Edit request not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
