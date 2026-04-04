import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getProjectAccessCookieName,
  isProjectAccessAuthorized,
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
  const cookieStore = await cookies();
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

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);

  try {
    const project = await uploadProjectVersion(projectId, files);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload images.",
      },
      { status: 400 },
    );
  }
}
