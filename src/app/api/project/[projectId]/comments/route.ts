import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createProjectComment,
  getProjectAccessCookieName,
  isProjectAccessAuthorized,
  isProjectFeedbackConfigured,
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
        imageId?: unknown;
        x?: unknown;
        y?: unknown;
        author?: unknown;
        content?: unknown;
      }
    | null;

  const imageId = typeof body?.imageId === "string" ? body.imageId : "";
  const x = typeof body?.x === "number" ? body.x : Number.NaN;
  const y = typeof body?.y === "number" ? body.y : Number.NaN;
  const author = typeof body?.author === "string" ? body.author : "";
  const content = typeof body?.content === "string" ? body.content : "";

  try {
    const project = await createProjectComment({
      projectId,
      imageId,
      x,
      y,
      author,
      content,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save comment.",
      },
      { status: 400 },
    );
  }
}
