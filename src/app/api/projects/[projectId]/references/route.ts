import { NextResponse } from "next/server";

import {
  handleProjectReferenceGet,
  handleProjectReferenceMutation,
} from "@/lib/projectReferenceRouteHandlers";
import { isProjectFeedbackConfigured } from "@/lib/projectFeedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Reference request failed.";
  const status = message === "Project not found." ? 404 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const { projectId } = await params;
    return NextResponse.json(await handleProjectReferenceGet(projectId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const { projectId } = await params;
    return NextResponse.json(await handleProjectReferenceMutation(request, projectId), {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  return POST(request, { params });
}
