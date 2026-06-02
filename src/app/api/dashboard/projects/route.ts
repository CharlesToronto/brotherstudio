import { NextResponse } from "next/server";

import {
  createDashboardProject,
  listDashboardProjects,
  type DashboardProjectCurrency,
  type DashboardProjectStatus,
} from "@/lib/dashboardStore";
import { createTeamClient, type TeamClientRecord } from "@/lib/teamStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await listDashboardProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard projects." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
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
    const clientName = typeof body?.clientName === "string" ? body.clientName.trim() : "";
    const clientCompany =
      typeof body?.clientCompany === "string" ? body.clientCompany.trim() : "";
    const clientEmail = typeof body?.clientEmail === "string" ? body.clientEmail.trim() : "";
    const projectName = typeof body?.projectName === "string" ? body.projectName.trim() : "";
    const expectedDate = typeof body?.expectedDate === "string" ? body.expectedDate : "";

    let teamClient: TeamClientRecord | null = null;
    const teamClientId =
      typeof body?.teamClientId === "string" && body.teamClientId.trim()
        ? body.teamClientId.trim()
        : null;

    if (!teamClientId && clientName) {
      teamClient = await createTeamClient({
        name: clientName,
        company: clientCompany,
        address: "",
        country: "",
        phone: typeof body?.clientPhone === "string" ? body.clientPhone : "",
        email: clientEmail,
        project: projectName,
        status: "new",
        nextFollowUp: "",
      });
    }

    const project = await createDashboardProject({
      clientName,
      clientCompany,
      clientEmail,
      clientPhone: typeof body?.clientPhone === "string" ? body.clientPhone : "",
      projectName,
      teamClientId: teamClient?.id ?? teamClientId,
      serviceTypes: Array.isArray(body?.serviceTypes)
        ? body.serviceTypes.filter((value): value is string => typeof value === "string")
        : [],
      status: typeof body?.status === "string" ? (body.status as DashboardProjectStatus) : "À venir",
      invoicedAmount:
        typeof body?.invoicedAmount === "number"
          ? body.invoicedAmount
          : Number(body?.invoicedAmount) || 0,
      upcomingAmount:
        typeof body?.upcomingAmount === "number"
          ? body.upcomingAmount
          : Number(body?.upcomingAmount) || 0,
      expectedDate,
      currency:
        typeof body?.currency === "string" ? (body.currency as DashboardProjectCurrency) : "CAD",
      exchangeRateToCad:
        typeof body?.exchangeRateToCad === "number"
          ? body.exchangeRateToCad
          : Number(body?.exchangeRateToCad) || 1.66,
    });

    return NextResponse.json({ project, teamClient }, { status: 201 });
  } catch (error) {
    console.error("Failed to create dashboard project", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create dashboard project." },
      { status: 400 },
    );
  }
}
