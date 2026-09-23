import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/adminSession";
import { isProjectFeedbackConfigured } from "@/lib/projectFeedbackStore";
import { sendProjectApprovalNotification } from "@/lib/projectNotifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  if (!isProjectFeedbackConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const { projectId } = await params;
    const recipientCount = await sendProjectApprovalNotification(projectId);
    return NextResponse.json({ recipientCount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send approval notification." },
      { status: 400 },
    );
  }
}
