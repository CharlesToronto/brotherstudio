import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getProjectAccessCookieName,
  isProjectAccessAuthorized,
  isProjectFeedbackConfigured,
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
  const cookieStore = await cookies();
  const isAuthorized = await isProjectAccessAuthorized(
    projectId,
    cookieStore.get(getProjectAccessCookieName(projectId))?.value,
  );

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Project password required." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        status?: unknown;
      }
    | null;

  const status = body?.status === "approved" ? "approved" : "in_review";

  try {
    const project = await updateProjectStatus(projectId, status as ProjectStatus);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update status.",
      },
      { status: 400 },
    );
  }
}
