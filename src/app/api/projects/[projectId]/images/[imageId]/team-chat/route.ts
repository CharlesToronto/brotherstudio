import { NextResponse } from "next/server";

import {
  createAdminProjectImageTeamMessage,
  isProjectFeedbackConfigured,
  listProjectImageTeamMessages,
} from "@/lib/projectFeedbackStore";

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
  const body = (await request.json().catch(() => null)) as
    | {
        content?: unknown;
        replyToMessageId?: unknown;
      }
    | null;

  const content = typeof body?.content === "string" ? body.content : "";
  const replyToMessageId =
    typeof body?.replyToMessageId === "string" ? body.replyToMessageId : null;

  try {
    const message = await createAdminProjectImageTeamMessage({
      projectId,
      imageId,
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
