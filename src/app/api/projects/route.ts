import { NextResponse } from "next/server";

import {
  createProject,
  isProjectFeedbackConfigured,
  listProjectSummaries,
} from "@/lib/projectFeedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json({ configured: false, projects: [] });
  }

  const projects = await listProjectSummaries();
  return NextResponse.json({ configured: true, projects });
}

export async function POST(request: Request) {
  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        name?: unknown;
        accessPassword?: unknown;
      }
    | null;

  const name = typeof body?.name === "string" ? body.name : "";
  const accessPassword =
    typeof body?.accessPassword === "string" ? body.accessPassword : "";

  try {
    const project = await createProject({ name, accessPassword });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create project.",
      },
      { status: 400 },
    );
  }
}
