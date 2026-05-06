import { NextResponse } from "next/server";

import { updateTeamClient, type TeamClientStatus } from "@/lib/teamStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;
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
    const client = await updateTeamClient(clientId, {
      ...(typeof body?.name === "string" ? { name: body.name } : null),
      ...(typeof body?.company === "string" ? { company: body.company } : null),
      ...(typeof body?.phone === "string" ? { phone: body.phone } : null),
      ...(typeof body?.email === "string" ? { email: body.email } : null),
      ...(typeof body?.project === "string" ? { project: body.project } : null),
      ...(typeof body?.status === "string" ? { status: body.status as TeamClientStatus } : null),
      ...(typeof body?.nextFollowUp === "string" ? { nextFollowUp: body.nextFollowUp } : null),
    });

    return NextResponse.json({ client });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update team client." },
      { status: 400 },
    );
  }
}
