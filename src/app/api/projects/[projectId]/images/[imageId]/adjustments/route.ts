import { NextResponse } from "next/server";

import {
  clearAdminProjectImageAdjustments,
  isProjectFeedbackConfigured,
  saveAdminProjectImageAdjustments,
} from "@/lib/projectFeedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const body = (await request.json().catch(() => null)) as
    | { adjustments?: unknown }
    | null;

  try {
    const adjustments = await saveAdminProjectImageAdjustments({
      projectId,
      imageId,
      adjustments: body?.adjustments,
    });
    return NextResponse.json({ adjustments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save image adjustments.";
    const status = message === "Image not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

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

  try {
    const adjustments = await clearAdminProjectImageAdjustments({
      projectId,
      imageId,
    });
    return NextResponse.json({ adjustments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset image adjustments.";
    const status = message === "Image not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
