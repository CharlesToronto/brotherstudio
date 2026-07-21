import { NextResponse } from "next/server";

import { deleteTeamClient, updateTeamClient, type TeamClientStatus } from "@/lib/teamStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  "Surrogate-Control": "no-store",
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        name?: unknown;
        company?: unknown;
        address?: unknown;
        country?: unknown;
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
      ...(typeof body?.address === "string" ? { address: body.address } : null),
      ...(typeof body?.country === "string" ? { country: body.country } : null),
      ...(typeof body?.phone === "string" ? { phone: body.phone } : null),
      ...(typeof body?.email === "string" ? { email: body.email } : null),
      ...(typeof body?.project === "string" ? { project: body.project } : null),
      ...(typeof body?.status === "string" ? { status: body.status as TeamClientStatus } : null),
      ...(typeof body?.nextFollowUp === "string" ? { nextFollowUp: body.nextFollowUp } : null),
    });

    return NextResponse.json({ client }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update team client." },
      { status: 400, headers: noStoreHeaders },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const { clientId } = await params;
    await deleteTeamClient(clientId);
    return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete team client." },
      { status: 400, headers: noStoreHeaders },
    );
  }
}
