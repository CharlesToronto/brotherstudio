import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { canProjectViewerRead, getProjectViewerCookieName } from "@/lib/projectFeedbackStore";
import { hasAdminSession } from "@/lib/adminSession";
import { dateInput, ProspectInputError, statusLabel, validateActivity, validateProspect, type Prospect, type ProspectActivity } from "@/lib/projectProspects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ projectId: string }> };
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
function errorResponse(error: unknown) {
  if (error instanceof ProspectInputError) return json({ error: error.message }, 400);
  const code = (error as { code?: string })?.code;
  if (["PGRST205", "PGRST204", "42703", "42P01"].includes(code ?? "")) return json({ error: "Le stockage des prospects n’est pas encore activé. Contactez l’administrateur du projet.", code: "SETUP_REQUIRED" }, 503);
  return json({ error: "Impossible de charger ou d’enregistrer les prospects. Réessayez." }, 500);
}
async function checkProject(projectId: string) {
  if (!uuid.test(projectId)) return json({ error: "Projet invalide." }, 400);
  const result = await getSupabaseAdminClient().from("projects").select("id").eq("id", projectId).maybeSingle();
  if (result.error) throw result.error;
  return result.data ? null : json({ error: "Projet introuvable." }, 404);
}
export async function GET(_: Request, { params }: Context) {
  try {
    if (!isSupabaseConfigured()) return json({ error: "Service indisponible." }, 503);
    const { projectId } = await params;
    const store = await cookies();
    if (!(await hasAdminSession()) && !(await canProjectViewerRead(projectId, store.get(getProjectViewerCookieName(projectId))?.value))) return json({ error: "Ouvrez le projet pour consulter ses prospects." }, 403);
    const missing = await checkProject(projectId);
    if (missing) return missing;
    const prospects: Prospect[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await getSupabaseAdminClient().from("project_prospects").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
      if (error) throw error;
      if (data.some((row) => !Array.isArray(row.activities) || !Array.isArray(row.tasks))) return json({ error: "La mise à jour du suivi des prospects doit être activée par l’administrateur.", code: "SETUP_REQUIRED" }, 503);
      prospects.push(...data as Prospect[]);
      if (data.length < 500) break;
    }
    const schema = await getSupabaseAdminClient().from("project_prospects").select("activities,tasks").eq("project_id", projectId).limit(1);
    if (schema.error) throw schema.error;
    return json({ prospects });
  } catch (error) { return errorResponse(error); }
}
async function mutate(request: Request, context: Context, method: "POST" | "PATCH" | "DELETE") {
  try {
    if (!isSupabaseConfigured()) return json({ error: "Service indisponible." }, 503);
    if (request.headers.get("origin") !== new URL(request.url).origin || !(await hasAdminSession())) return json({ error: "Ouvrez MyReview Admin pour modifier les prospects." }, 403);
    const { projectId } = await context.params;
    const missing = await checkProject(projectId);
    if (missing) return missing;
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ProspectInputError("Requête invalide.");
    const db = getSupabaseAdminClient();
    const systemEvent = (content: string): ProspectActivity => ({ id: crypto.randomUUID(), kind: "system", content, outcome: "", occurred_at: new Date().toISOString(), created_at: new Date().toISOString() });
    if (method === "POST") {
      const input = validateProspect(body, true);
      const { data, error } = await db.from("project_prospects").insert({ ...input, project_id: projectId, activities: [systemEvent("Prospect ajouté manuellement.")] }).select("*").single();
      if (error) throw error;
      return json({ prospect: data }, 201);
    }
    if (typeof body.id !== "string" || !uuid.test(body.id)) throw new ProspectInputError("Prospect invalide.");
    const current = await db.from("project_prospects").select("*").eq("project_id", projectId).eq("id", body.id).maybeSingle();
    if (current.error) throw current.error;
    if (!current.data) return json({ error: "Prospect introuvable." }, 404);
    const prospect = current.data as Prospect;
    if (body.updated_at !== prospect.updated_at) return json({ error: "Cette fiche a changé. Actualisez avant de réessayer." }, 409);
    if (method === "DELETE") {
      const result = await db.from("project_prospects").delete().eq("project_id", projectId).eq("id", body.id).eq("updated_at", prospect.updated_at).select("id");
      if (result.error) throw result.error;
      return result.data.length ? json({ ok: true }) : json({ error: "Cette fiche a changé. Actualisez avant de réessayer." }, 409);
    }
    let update: Record<string, unknown> = {};
    let events = prospect.activities;
    if (body.action === "activity") {
      const activity = validateActivity(body);
      events = [...events, activity];
      if (["call", "email", "meeting"].includes(activity.kind) && (!prospect.last_contacted_at || Date.parse(activity.occurred_at) > Date.parse(prospect.last_contacted_at))) update.last_contacted_at = activity.occurred_at;
    } else if (body.action === "task") {
      if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 300) throw new ProspectInputError("Précisez la prochaine action.");
      const due = dateInput(body.due_at);
      if (!due) throw new ProspectInputError("Précisez une échéance.");
      update.tasks = [...prospect.tasks, { id: crypto.randomUUID(), title: body.title.trim(), due_at: due, completed_at: null, created_at: new Date().toISOString() }];
      events = [...events, systemEvent(`Action planifiée : ${body.title.trim()}`)];
    } else if (body.action === "complete_task") {
      const task = prospect.tasks.find((entry) => entry.id === body.task_id);
      if (!task || task.completed_at) throw new ProspectInputError("Action introuvable ou déjà terminée.");
      update.tasks = prospect.tasks.map((entry) => entry.id === task.id ? { ...entry, completed_at: new Date().toISOString() } : entry);
      events = [...events, systemEvent(`Action terminée : ${task.title}`)];
    } else if (body.action === "complete_follow_up") {
      update.next_follow_up_at = null;
      events = [...events, systemEvent("Relance effectuée.")];
    } else if (!body.action || body.action === "update") {
      update = validateProspect(body);
      const changed = Object.keys(update).filter((key) => update[key] !== prospect[key as keyof Prospect]);
      if (changed.length) events = [...events, systemEvent(update.status && update.status !== prospect.status ? `Statut : ${statusLabel(prospect.status)} → ${statusLabel(update.status as Prospect["status"])}` : "Fiche prospect mise à jour.")];
    } else throw new ProspectInputError("Action inconnue.");
    const result = await db.from("project_prospects").update({ ...update, activities: events }).eq("project_id", projectId).eq("id", body.id).eq("updated_at", prospect.updated_at).select("*").maybeSingle();
    if (result.error) throw result.error;
    return result.data ? json({ prospect: result.data }) : json({ error: "Cette fiche a changé. Actualisez avant de réessayer." }, 409);
  } catch (error) { return errorResponse(error); }
}
export const POST = (request: Request, context: Context) => mutate(request, context, "POST");
export const PATCH = (request: Request, context: Context) => mutate(request, context, "PATCH");
export const DELETE = (request: Request, context: Context) => mutate(request, context, "DELETE");
