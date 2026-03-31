import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getProjectAccessCookieName,
  isProjectAccessAuthorized,
  isProjectFeedbackConfigured,
  registerProjectViewer,
} from "@/lib/projectFeedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
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
        email?: unknown;
      }
    | null;

  const email = typeof body?.email === "string" ? body.email : "";

  try {
    const project = await registerProjectViewer({
      projectId,
      email,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to open project.";
    const status = message === "Project not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
