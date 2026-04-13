import { NextResponse } from "next/server";

import {
  isProjectFeedbackConfigured,
  listProjectImageDrawingLayer,
  saveAdminProjectImageDrawingLayer,
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
  const body = (await request.json().catch(() => null)) as
    | {
        elements?: unknown;
      }
    | null;

  const elements = Array.isArray(body?.elements)
    ? (body.elements as ProjectFeedbackDrawingElement[])
    : [];

  try {
    const layer = await saveAdminProjectImageDrawingLayer({
      projectId,
      imageId,
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
