import { NextResponse } from "next/server";

import {
  getProjectAccessCookieName,
  isProjectFeedbackConfigured,
  verifyProjectAccessPassword,
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
  const body = (await request.json().catch(() => null)) as
    | {
        password?: unknown;
      }
    | null;

  const password = typeof body?.password === "string" ? body.password : "";

  try {
    const isValid = await verifyProjectAccessPassword(projectId, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid parcel number." },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getProjectAccessCookieName(projectId), password.trim(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unlock project.";
    const status = message === "Project not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
