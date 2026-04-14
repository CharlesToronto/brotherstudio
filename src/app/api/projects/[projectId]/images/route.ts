import { NextResponse } from "next/server";

import {
  commitProjectVersionUpload,
  isProjectFeedbackConfigured,
  prepareProjectVersionUpload,
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
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await request.json()) as
        | {
            action?: "prepare-upload" | "commit-upload";
            files?: Array<{ name: string; type: string }>;
            version?: number | null;
            uploads?: Array<{ publicUrl: string }>;
          }
        | null;

      if (payload?.action === "prepare-upload") {
        const result = await prepareProjectVersionUpload(projectId, payload.files ?? [], {
          targetVersion:
            typeof payload.version === "number" ? payload.version : null,
        });
        return NextResponse.json(result, { status: 200 });
      }

      if (payload?.action === "commit-upload") {
        const result = await commitProjectVersionUpload(projectId, {
          version:
            typeof payload.version === "number" ? payload.version : Number.NaN,
          uploads: payload.uploads ?? [],
        });
        return NextResponse.json(result, { status: 201 });
      }

      return NextResponse.json(
        { error: "Invalid upload action." },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);
    const versionRaw = formData.get("version");
    const version =
      typeof versionRaw === "string" && versionRaw.trim()
        ? Number.parseInt(versionRaw, 10)
        : null;

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
