import { NextResponse } from "next/server";

import { createTeamClient, listTeamClients, type TeamClientStatus } from "@/lib/teamStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clients = await listTeamClients();
    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load team clients." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        name?: unknown;
        company?: unknown;
        phone?: unknown;
        email?: unknown;
        project?: unknown;
        status?: unknown;
        nextFollowUp?: unknown;
      }
    | null;

  try {
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 });
    }

    const client = await createTeamClient({
      name,
      company: typeof body?.company === "string" ? body.company : "",
      phone: typeof body?.phone === "string" ? body.phone : "",
      email: typeof body?.email === "string" ? body.email : "",
      project: typeof body?.project === "string" ? body.project : "",
      status: typeof body?.status === "string" ? (body.status as TeamClientStatus) : "new",
      nextFollowUp: typeof body?.nextFollowUp === "string" ? body.nextFollowUp : "",
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create team client." },
      { status: 400 },
    );
  }
}
