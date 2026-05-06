import { NextResponse } from "next/server";

import { getTeamNote, upsertTeamNote } from "@/lib/teamStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const { clientId } = await params;
    const note = await getTeamNote(clientId);
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load team note." },
      { status: 400 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const body = (await request.json().catch(() => null)) as { content?: unknown } | null;

  try {
    const { clientId } = await params;
    const note = await upsertTeamNote(
      clientId,
      typeof body?.content === "string" ? body.content : "",
    );
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save team note." },
      { status: 400 },
    );
  }
}
