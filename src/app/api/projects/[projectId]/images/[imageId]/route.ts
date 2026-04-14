import { NextResponse } from "next/server";

import {
  commitProjectImageReplacement,
  deleteProjectImage,
  isProjectFeedbackConfigured,
  prepareProjectImageReplacement,
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
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await request.json()) as
        | {
            action?: "prepare-replace" | "commit-replace";
            file?: { name: string; type: string };
            publicUrl?: string;
          }
        | null;

      if (payload?.action === "prepare-replace") {
        if (!payload.file) {
          return NextResponse.json(
            { error: "Select one image to replace the existing file." },
            { status: 400 },
          );
        }

        const result = await prepareProjectImageReplacement(
          projectId,
          imageId,
          payload.file,
        );
        return NextResponse.json(result);
      }

      if (payload?.action === "commit-replace") {
        const project = await commitProjectImageReplacement(projectId, imageId, {
          publicUrl: payload.publicUrl?.trim() ?? "",
        });
        return NextResponse.json({ project });
      }

      return NextResponse.json(
        { error: "Invalid replace action." },
        { status: 400 },
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

    const project = await replaceProjectImage(projectId, imageId, file);
    return NextResponse.json({ project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to replace image.";
    const status = message === "Image not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
