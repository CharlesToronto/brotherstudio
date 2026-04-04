import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getProjectAccessCookieName,
  getProjectViewerCookieName,
  getProjectViewerRoleCookieName,
  isProjectAccessAuthorized,
  isProjectFeedbackConfigured,
  verifyProjectAccessPassword,
  registerProjectViewer,
} from "@/lib/projectFeedbackStore";
import {
  normalizeProjectViewerEmail,
  normalizeProjectViewerRole,
} from "@/lib/projectViewerIdentity";

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

  const body = (await request.json().catch(() => null)) as
    | {
        email?: unknown;
        password?: unknown;
        role?: unknown;
      }
    | null;

  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = normalizeProjectViewerRole(
    typeof body?.role === "string" ? body.role : null,
  );

  try {
    const existingPassword =
      cookieStore.get(getProjectAccessCookieName(projectId))?.value ?? null;

    if (role === "team") {
      const isAuthorized =
        (await isProjectAccessAuthorized(projectId, existingPassword)) ||
        (await verifyProjectAccessPassword(projectId, password));

      if (!isAuthorized) {
        return NextResponse.json(
          { error: "Invalid parcel number." },
          { status: 403 },
        );
      }
    }

    const project = await registerProjectViewer({
      projectId,
      email,
    });

    const response = NextResponse.json({ project }, { status: 201 });
    response.cookies.set(
      getProjectViewerRoleCookieName(projectId),
      role,
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      },
    );
    response.cookies.set(
      getProjectViewerCookieName(projectId),
      normalizeProjectViewerEmail(email),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      },
    );
    if (role === "team" && password.trim()) {
      response.cookies.set(getProjectAccessCookieName(projectId), password.trim(), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to open project.";
    const status = message === "Project not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
