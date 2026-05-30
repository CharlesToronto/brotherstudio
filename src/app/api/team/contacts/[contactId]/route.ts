import { NextResponse } from "next/server";

import {
  deleteTeamClientContact,
  updateTeamClientContact,
} from "@/lib/teamStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ contactId: string }> },
) {
  const { contactId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        name?: unknown;
        lastContact?: unknown;
        note?: unknown;
        nextContact?: unknown;
      }
    | null;

  try {
    const contact = await updateTeamClientContact(contactId, {
      ...(typeof body?.name === "string" ? { name: body.name } : null),
      ...(typeof body?.lastContact === "string"
        ? { lastContact: body.lastContact }
        : null),
      ...(typeof body?.note === "string" ? { note: body.note } : null),
      ...(typeof body?.nextContact === "string"
        ? { nextContact: body.nextContact }
        : null),
    });

    return NextResponse.json({ contact });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update team contact." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ contactId: string }> },
) {
  try {
    const { contactId } = await params;
    await deleteTeamClientContact(contactId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete team contact." },
      { status: 400 },
    );
  }
}
