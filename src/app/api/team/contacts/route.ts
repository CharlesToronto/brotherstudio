import { NextResponse } from "next/server";

import {
  createTeamClientContact,
  listTeamClientContacts,
} from "@/lib/teamStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const contacts = await listTeamClientContacts();
    return NextResponse.json({ contacts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load team contacts." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        clientId?: unknown;
        name?: unknown;
        lastContact?: unknown;
        note?: unknown;
        nextContact?: unknown;
      }
    | null;

  try {
    const clientId = typeof body?.clientId === "string" ? body.clientId.trim() : "";
    if (!clientId) {
      return NextResponse.json({ error: "Client id is required." }, { status: 400 });
    }

    const contact = await createTeamClientContact({
      clientId,
      name: typeof body?.name === "string" ? body.name : "",
      lastContact: typeof body?.lastContact === "string" ? body.lastContact : "",
      note: typeof body?.note === "string" ? body.note : "",
      nextContact: typeof body?.nextContact === "string" ? body.nextContact : "",
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create team contact." },
      { status: 400 },
    );
  }
}
