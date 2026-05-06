import { NextResponse } from "next/server";

import { listTeamQa, replaceTeamQa, type TeamQaRecord } from "@/lib/teamStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listTeamQa();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load team Q&A." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { items?: unknown }
    | null;

  try {
    if (!Array.isArray(body?.items)) {
      return NextResponse.json({ error: "Q&A items must be an array." }, { status: 400 });
    }

    const items = (body.items as Array<Partial<TeamQaRecord>>).map((item, index) => ({
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `qa_${crypto.randomUUID()}`,
      question: typeof item.question === "string" ? item.question : "",
      answer: typeof item.answer === "string" ? item.answer : "",
      order: index,
    }));

    const nextItems = await replaceTeamQa(items);
    return NextResponse.json({ items: nextItems });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save team Q&A." },
      { status: 400 },
    );
  }
}
