import { NextResponse } from "next/server";

import {
  deleteProjectComment,
  isProjectFeedbackConfigured,
  updateProjectComment,
} from "@/lib/projectFeedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
