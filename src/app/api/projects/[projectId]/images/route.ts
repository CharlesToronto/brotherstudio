import { NextResponse } from "next/server";

import {
  isProjectFeedbackConfigured,
  uploadProjectVersion,
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
  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);
  const versionRaw = formData.get("version");
  const version =
    typeof versionRaw === "string" && versionRaw.trim()
      ? Number.parseInt(versionRaw, 10)
      : null;

  try {
    const result = await uploadProjectVersion(projectId, files, {
      targetVersion: Number.isInteger(version) ? version : null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload images.",
      },
      { status: 400 },
    );
  }
}
