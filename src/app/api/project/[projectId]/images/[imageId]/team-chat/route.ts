import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  canProjectViewerInteract,
  canProjectViewerRead,
  createProjectImageTeamMessage,
  getProjectAccessCookieName,
  getProjectViewerCookieName,
  getProjectViewerRoleCookieName,
  isProjectFeedbackConfigured,
  listProjectImageTeamMessages,
} from "@/lib/projectFeedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorizeProjectAccess(projectId: string) {
  const cookieStore = await cookies();
  return canProjectViewerRead(
    projectId,
    cookieStore.get(getProjectViewerCookieName(projectId))?.value,
  );
}

async function authorizeProjectInteraction(projectId: string) {
  const cookieStore = await cookies();
  return canProjectViewerInteract({
    projectId,
    password: cookieStore.get(getProjectAccessCookieName(projectId))?.value,
    viewerRole: cookieStore.get(getProjectViewerRoleCookieName(projectId))?.value,
    viewerEmail: cookieStore.get(getProjectViewerCookieName(projectId))?.value,
  });
}

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
  const isAuthorized = await authorizeProjectAccess(projectId);

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Open the project with your email to view the team chat." },
      { status: 403 },
    );
  }

  try {
    const messages = await listProjectImageTeamMessages(projectId, imageId);
    return NextResponse.json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load team chat.";
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
  const isAuthorized = await authorizeProjectInteraction(projectId);

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Team member access is required to send team chat messages." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        viewerEmail?: unknown;
        content?: unknown;
        replyToMessageId?: unknown;
      }
    | null;

  const cookieStore = await cookies();
  const viewerEmail =
    cookieStore.get(getProjectViewerCookieName(projectId))?.value ??
    (typeof body?.viewerEmail === "string" ? body.viewerEmail : "");
  const content = typeof body?.content === "string" ? body.content : "";
  const replyToMessageId =
    typeof body?.replyToMessageId === "string" ? body.replyToMessageId : null;

  try {
    const message = await createProjectImageTeamMessage({
      projectId,
      imageId,
      viewerEmail,
      content,
      replyToMessageId,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send team chat message.";
    const status = message === "Image not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
