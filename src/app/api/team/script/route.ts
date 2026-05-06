import { NextResponse } from "next/server";

import { getTeamScript, saveTeamScript, type TeamScriptStep } from "@/lib/teamStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const script = await getTeamScript();
    return NextResponse.json({ script });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load team script." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { structure?: unknown }
    | null;

  try {
    if (!Array.isArray(body?.structure)) {
      return NextResponse.json({ error: "Script structure must be an array." }, { status: 400 });
    }

    const script = await saveTeamScript(body.structure as TeamScriptStep[]);
    return NextResponse.json({ script });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save team script." },
      { status: 400 },
    );
  }
}
