import { NextResponse } from "next/server";

import {
  deleteProject,
  isProjectFeedbackConfigured,
  updateProjectSettings,
  updateProjectStatus,
} from "@/lib/projectFeedbackStore";
import type { ProjectStatus } from "@/lib/projectFeedbackTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 },
    );
  }

  const { projectId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        name?: unknown;
        accessPassword?: unknown;
        status?: unknown;
      }
    | null;

  const name = typeof body?.name === "string" ? body.name : undefined;
  const accessPassword =
    typeof body?.accessPassword === "string" ? body.accessPassword : undefined;
  const status =
    body?.status === "approved" || body?.status === "in_review"
      ? (body.status as ProjectStatus)
      : undefined;

  try {
    const project = status
      ? await updateProjectStatus(projectId, status)
      : await updateProjectSettings(projectId, {
          name,
          accessPassword,
        });

    return NextResponse.json({ project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update project.";
    const status = message === "Project not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 },
    );
  }

  const { projectId } = await params;

  try {
    await deleteProject(projectId);
    return NextResponse.json({ projectId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete project.";
    const status = message === "Project not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
