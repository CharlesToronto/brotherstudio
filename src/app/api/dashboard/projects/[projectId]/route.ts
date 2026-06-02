import { NextResponse } from "next/server";

import {
  deleteDashboardProject,
  updateDashboardProject,
  type DashboardProjectCurrency,
  type DashboardProjectStatus,
} from "@/lib/dashboardStore";
import { createTeamClient, type TeamClientRecord } from "@/lib/teamStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        clientName?: unknown;
        clientCompany?: unknown;
        clientEmail?: unknown;
        clientPhone?: unknown;
        projectName?: unknown;
        teamClientId?: unknown;
        serviceTypes?: unknown;
        status?: unknown;
        invoicedAmount?: unknown;
        upcomingAmount?: unknown;
        expectedDate?: unknown;
        currency?: unknown;
        exchangeRateToCad?: unknown;
      }
    | null;

  try {
    let teamClient: TeamClientRecord | null = null;
    const teamClientId =
      body?.teamClientId === null
        ? null
        : typeof body?.teamClientId === "string" && body.teamClientId.trim()
          ? body.teamClientId.trim()
          : null;

    if (!teamClientId && typeof body?.clientName === "string" && body.clientName.trim()) {
      teamClient = await createTeamClient({
        name: body.clientName.trim(),
        company: typeof body?.clientCompany === "string" ? body.clientCompany : "",
        address: "",
        country: "",
        phone: typeof body?.clientPhone === "string" ? body.clientPhone : "",
        email: typeof body?.clientEmail === "string" ? body.clientEmail.trim() : "",
        project: typeof body?.projectName === "string" ? body.projectName : "",
        status: "new",
        nextFollowUp: "",
      });
    }

    const project = await updateDashboardProject(projectId, {
      ...(typeof body?.clientName === "string" ? { clientName: body.clientName } : null),
      ...(typeof body?.clientCompany === "string"
        ? { clientCompany: body.clientCompany }
        : null),
      ...(typeof body?.clientEmail === "string" ? { clientEmail: body.clientEmail } : null),
      ...(typeof body?.clientPhone === "string" ? { clientPhone: body.clientPhone } : null),
      ...(typeof body?.projectName === "string" ? { projectName: body.projectName } : null),
      ...(teamClient?.id
        ? { teamClientId: teamClient.id }
        : body?.teamClientId === null
          ? { teamClientId: null }
          : typeof body?.teamClientId === "string"
            ? { teamClientId: body.teamClientId }
            : null),
      ...(Array.isArray(body?.serviceTypes)
        ? {
            serviceTypes: body.serviceTypes.filter(
              (value): value is string => typeof value === "string",
            ),
          }
        : null),
      ...(typeof body?.status === "string"
        ? { status: body.status as DashboardProjectStatus }
        : null),
      ...(body?.invoicedAmount !== undefined
        ? { invoicedAmount: Number(body.invoicedAmount) || 0 }
        : null),
      ...(body?.upcomingAmount !== undefined
        ? { upcomingAmount: Number(body.upcomingAmount) || 0 }
        : null),
      ...(typeof body?.expectedDate === "string" ? { expectedDate: body.expectedDate } : null),
      ...(typeof body?.currency === "string"
        ? { currency: body.currency as DashboardProjectCurrency }
        : null),
      ...(body?.exchangeRateToCad !== undefined
        ? { exchangeRateToCad: Number(body.exchangeRateToCad) || 1.66 }
        : null),
    });

    return NextResponse.json({ project, teamClient });
  } catch (error) {
    console.error("Failed to update dashboard project", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update dashboard project." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    await deleteDashboardProject(projectId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete dashboard project", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete dashboard project." },
      { status: 400 },
    );
  }
}
