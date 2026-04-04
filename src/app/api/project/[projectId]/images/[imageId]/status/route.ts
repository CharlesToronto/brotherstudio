import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/errorMessage";
import {
  getProjectAccessCookieName,
  getProjectViewerRoleCookieName,
  isProjectAccessAuthorized,
  isProjectFeedbackConfigured,
  updateProjectImageStatus,
} from "@/lib/projectFeedbackStore";
import type { ProjectStatus } from "@/lib/projectFeedbackTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
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
  const currentRole = cookieStore.get(getProjectViewerRoleCookieName(projectId))?.value;

  if (currentRole === "visitor") {
    return NextResponse.json(
      { error: "Visitor access cannot approve an image." },
      { status: 403 },
    );
  }

  const isAuthorized = await isProjectAccessAuthorized(
    projectId,
    cookieStore.get(getProjectAccessCookieName(projectId))?.value,
  );

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Parcel number required." },
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
    const project = await updateProjectImageStatus(
      projectId,
      imageId,
      status as ProjectStatus,
    );
    return NextResponse.json({ project });
  } catch (error) {
    const message = getErrorMessage(error, "Failed to update image status.");
    const responseStatus = message === "Image not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status: responseStatus });
  }
}
