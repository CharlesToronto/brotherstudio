import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const DASHBOARD_PROJECT_STATUSES = [
  "Réalisé",
  "En cours",
  "À venir",
  "En attente",
  "En attente de payment",
  "Terminé",
] as const;

export const DASHBOARD_PROJECT_CURRENCIES = ["CAD", "CHF"] as const;
export const DASHBOARD_SERVICE_OPTIONS = [
  "Images 3D photorealistes interieures",
  "Images 3D photorealistes exterieures",
  "3D FloorPlan",
  "Plan de vente pour brochure",
  "Photo (Drone View)",
  "Video Walkthrough",
  "Walkthrough Classic (clic & walk)",
  "Video Marketing (emotionnelle / cinematique)",
  "Videorealistes 3D (Drone View)",
  "Villa forfait",
  "Immeuble forfait",
] as const;

export type DashboardProjectStatus = (typeof DASHBOARD_PROJECT_STATUSES)[number];
export type DashboardProjectCurrency = (typeof DASHBOARD_PROJECT_CURRENCIES)[number];

export type DashboardProjectRecord = {
  id: string;
  teamClientId: string | null;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  projectName: string;
  serviceTypes: string[];
  status: DashboardProjectStatus;
  invoicedAmount: number;
  upcomingAmount: number;
  expectedDate: string;
  currency: DashboardProjectCurrency;
  exchangeRateToCad: number;
  createdAt: string;
  updatedAt: string;
};

type DashboardProjectRow = {
  id: string;
  team_client_id: string | null;
  client_name: string | null;
  client_company: string | null;
  client_email: string | null;
  client_phone: string | null;
  project_name: string | null;
  service_types: string[] | null;
  status: string | null;
  invoiced_amount: number | string | null;
  upcoming_amount: number | string | null;
  expected_date: string | null;
  currency: string | null;
  exchange_rate_to_cad: number | string | null;
  created_at: string;
  updated_at: string;
};

function assertDashboardConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
}

function isMissingTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code.trim() : "";
  const combined = [candidate.message, candidate.details, candidate.hint]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    combined.includes(`relation "${tableName.toLowerCase()}" does not exist`) ||
    combined.includes(`could not find the table 'public.${tableName.toLowerCase()}'`)
  );
}

function normalizeStatus(value: string | null | undefined): DashboardProjectStatus {
  return DASHBOARD_PROJECT_STATUSES.includes(value as DashboardProjectStatus)
    ? (value as DashboardProjectStatus)
    : "À venir";
}

function normalizeCurrency(value: string | null | undefined): DashboardProjectCurrency {
  return DASHBOARD_PROJECT_CURRENCIES.includes(value as DashboardProjectCurrency)
    ? (value as DashboardProjectCurrency)
    : "CAD";
}

function normalizeAmount(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeProjectRow(row: DashboardProjectRow): DashboardProjectRecord {
  return {
    id: row.id,
    teamClientId: row.team_client_id,
    clientName: row.client_name?.trim() ?? "",
    clientCompany: row.client_company?.trim() ?? "",
    clientEmail: row.client_email?.trim() ?? "",
    clientPhone: row.client_phone?.trim() ?? "",
    projectName: row.project_name?.trim() ?? "",
    serviceTypes: Array.isArray(row.service_types)
      ? row.service_types.filter((value): value is string => typeof value === "string")
      : [],
    status: normalizeStatus(row.status),
    invoicedAmount: normalizeAmount(row.invoiced_amount),
    upcomingAmount: normalizeAmount(row.upcoming_amount),
    expectedDate: row.expected_date?.trim() ?? "",
    currency: normalizeCurrency(row.currency),
    exchangeRateToCad:
      normalizeCurrency(row.currency) === "CAD"
        ? 1
        : normalizeAmount(row.exchange_rate_to_cad) > 0
          ? normalizeAmount(row.exchange_rate_to_cad)
          : 1.66,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProjectPayload(
  input: Omit<DashboardProjectRecord, "id" | "createdAt" | "updatedAt">,
) {
  return {
    team_client_id: input.teamClientId,
    client_name: input.clientName.trim(),
    client_company: input.clientCompany.trim(),
    client_email: input.clientEmail.trim(),
    client_phone: input.clientPhone.trim(),
    project_name: input.projectName.trim(),
    service_types: input.serviceTypes,
    status: normalizeStatus(input.status),
    invoiced_amount: Number.isFinite(input.invoicedAmount) ? input.invoicedAmount : 0,
    upcoming_amount: Number.isFinite(input.upcomingAmount) ? input.upcomingAmount : 0,
    expected_date: input.expectedDate.trim() || null,
    currency: normalizeCurrency(input.currency),
    exchange_rate_to_cad:
      normalizeCurrency(input.currency) === "CAD"
        ? 1
        : Number.isFinite(input.exchangeRateToCad) && input.exchangeRateToCad > 0
          ? input.exchangeRateToCad
          : 1.66,
  };
}

export async function listDashboardProjects(): Promise<DashboardProjectRecord[]> {
  assertDashboardConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dashboard_projects")
    .select(
      "id, team_client_id, client_name, client_company, client_email, client_phone, project_name, service_types, status, invoiced_amount, upcoming_amount, expected_date, currency, exchange_rate_to_cad, created_at, updated_at",
    )
    .order("expected_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error, "dashboard_projects")) {
      throw new Error("Missing Supabase table: dashboard_projects.");
    }
    throw error;
  }

  return (data ?? []).map((row) => normalizeProjectRow(row as DashboardProjectRow));
}

export async function createDashboardProject(
  input: Omit<DashboardProjectRecord, "id" | "createdAt" | "updatedAt">,
) {
  assertDashboardConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dashboard_projects")
    .insert(toProjectPayload(input))
    .select(
      "id, team_client_id, client_name, client_company, client_email, client_phone, project_name, service_types, status, invoiced_amount, upcoming_amount, expected_date, currency, exchange_rate_to_cad, created_at, updated_at",
    )
    .single();

  if (error) {
    if (isMissingTableError(error, "dashboard_projects")) {
      throw new Error("Missing Supabase table: dashboard_projects.");
    }
    throw error;
  }

  return normalizeProjectRow(data as DashboardProjectRow);
}

export async function updateDashboardProject(
  id: string,
  patch: Partial<Omit<DashboardProjectRecord, "id" | "createdAt" | "updatedAt">>,
) {
  assertDashboardConfigured();
  const supabase = getSupabaseAdminClient();
  const payload: Record<string, string | number | string[] | null> = {};

  if (typeof patch.clientName === "string") payload.client_name = patch.clientName.trim();
  if (typeof patch.clientCompany === "string") {
    payload.client_company = patch.clientCompany.trim();
  }
  if (patch.teamClientId === null || typeof patch.teamClientId === "string") {
    payload.team_client_id = patch.teamClientId;
  }
  if (typeof patch.clientEmail === "string") payload.client_email = patch.clientEmail.trim();
  if (typeof patch.clientPhone === "string") payload.client_phone = patch.clientPhone.trim();
  if (typeof patch.projectName === "string") payload.project_name = patch.projectName.trim();
  if (Array.isArray(patch.serviceTypes)) payload.service_types = patch.serviceTypes;
  if (typeof patch.status === "string") payload.status = normalizeStatus(patch.status);
  if (typeof patch.invoicedAmount === "number" && Number.isFinite(patch.invoicedAmount)) {
    payload.invoiced_amount = patch.invoicedAmount;
  }
  if (typeof patch.upcomingAmount === "number" && Number.isFinite(patch.upcomingAmount)) {
    payload.upcoming_amount = patch.upcomingAmount;
  }
  if (typeof patch.expectedDate === "string") {
    payload.expected_date = patch.expectedDate.trim() || null;
  }
  if (typeof patch.currency === "string") payload.currency = normalizeCurrency(patch.currency);
  if (typeof patch.exchangeRateToCad === "number" && Number.isFinite(patch.exchangeRateToCad)) {
    payload.exchange_rate_to_cad = patch.exchangeRateToCad > 0 ? patch.exchangeRateToCad : 1.66;
  }

  const { data, error } = await supabase
    .from("dashboard_projects")
    .update(payload)
    .eq("id", id)
    .select(
      "id, team_client_id, client_name, client_company, client_email, client_phone, project_name, service_types, status, invoiced_amount, upcoming_amount, expected_date, currency, exchange_rate_to_cad, created_at, updated_at",
    )
    .single();

  if (error) {
    if (isMissingTableError(error, "dashboard_projects")) {
      throw new Error("Missing Supabase table: dashboard_projects.");
    }
    throw error;
  }

  return normalizeProjectRow(data as DashboardProjectRow);
}

export async function deleteDashboardProject(id: string) {
  assertDashboardConfigured();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("dashboard_projects").delete().eq("id", id);

  if (error) {
    if (isMissingTableError(error, "dashboard_projects")) {
      throw new Error("Missing Supabase table: dashboard_projects.");
    }
    throw error;
  }
}
