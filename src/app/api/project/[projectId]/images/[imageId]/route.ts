import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  deleteProjectImage,
  getProjectAccessCookieName,
  isProjectAccessAuthorized,
  isProjectFeedbackConfigured,
  replaceProjectImage,
} from "@/lib/projectFeedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
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

  try {
    const project = await deleteProjectImage(projectId, imageId);
    return NextResponse.json({ project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete image.";
    const status = message === "Image not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
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

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Select one image to replace the existing file." },
      { status: 400 },
    );
  }

  try {
    const project = await replaceProjectImage(projectId, imageId, file);
    return NextResponse.json({ project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to replace image.";
    const status = message === "Image not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
