export const prospectStatuses = [
  ["new", "Nouveau"], ["to_contact", "À contacter"], ["contacted", "Contacté"],
  ["qualified", "Qualifié"], ["visit_scheduled", "Visite planifiée"], ["not_interested", "Pas intéressé"],
] as const;
export type ProspectStatus = (typeof prospectStatuses)[number][0];
export const activityKinds = [["call", "Appel"], ["email", "Courriel"], ["meeting", "Visite / rencontre"], ["note", "Note"]] as const;
export type ActivityKind = (typeof activityKinds)[number][0];
export type ProspectActivity = { id: string; kind: ActivityKind | "system"; content: string; outcome: string; occurred_at: string; created_at: string };
export type ProspectTask = { id: string; title: string; due_at: string; completed_at: string | null; created_at: string };
export type Prospect = {
  id: string; project_id: string; name: string; email: string; phone: string; source: string;
  interest: string; budget: string; timeline: string; status: ProspectStatus; notes: string;
  message: string; owner: string; language: string; temperature: "cold" | "warm" | "hot";
  last_contacted_at: string | null; next_follow_up_at: string | null;
  activities: ProspectActivity[]; tasks: ProspectTask[]; created_at: string; updated_at: string;
};
export const prospectDraft = {
  name: "", email: "", phone: "", source: "", interest: "", budget: "", timeline: "",
  status: "new" as ProspectStatus, notes: "", message: "", owner: "", language: "Français",
  temperature: "warm" as Prospect["temperature"], next_follow_up_at: "",
};
export type ProspectDraft = typeof prospectDraft;
export function statusLabel(status: ProspectStatus) {
  return prospectStatuses.find(([key]) => key === status)?.[1] ?? status;
}
export function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function isDueToday(value: string, now = new Date()) {
  return new Date(value).toDateString() === now.toDateString();
}
export function pendingTasks(prospect: Prospect) {
  return prospect.tasks.filter((task) => !task.completed_at);
}
export function nextDue(prospect: Prospect) {
  if (prospect.status === "not_interested") return null;
  const dates = [prospect.next_follow_up_at, ...pendingTasks(prospect).map((task) => task.due_at)].filter((date): date is string => Boolean(date));
  return dates.sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null;
}
export function hasDueToday(prospect: Prospect, now = new Date()) {
  if (prospect.status === "not_interested") return false;
  return [prospect.next_follow_up_at, ...pendingTasks(prospect).map((task) => task.due_at)].some((date) => date && isDueToday(date, now));
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export class ProspectInputError extends Error {}
function text(body: Record<string, unknown>, key: string, max = 2000) {
  if (typeof body[key] !== "string" || body[key].length > max) throw new ProspectInputError(`Champ invalide : ${key}.`);
  return body[key].trim();
}
export function dateInput(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new ProspectInputError("Date invalide.");
  return new Date(value).toISOString();
}
export function validateProspect(body: Record<string, unknown>, creating = false) {
  const result: Record<string, string | null> = {};
  for (const key of Object.keys(prospectDraft)) {
    if (!(key in body)) continue;
    result[key] = key === "next_follow_up_at" ? dateInput(body[key]) : text(body, key, key === "notes" || key === "message" ? 10000 : 300);
  }
  if ((creating || "name" in body) && !result.name) throw new ProspectInputError("Le nom est obligatoire.");
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new ProspectInputError("Le courriel est invalide.");
  if (result.status !== undefined && !prospectStatuses.some(([key]) => key === result.status)) throw new ProspectInputError("Statut invalide.");
  if (result.temperature !== undefined && !["cold", "warm", "hot"].includes(result.temperature ?? "")) throw new ProspectInputError("Niveau d’intérêt invalide.");
  return result;
}
export function validateActivity(body: Record<string, unknown>): ProspectActivity {
  const kind = text(body, "kind", 20);
  if (!activityKinds.some(([key]) => key === kind)) throw new ProspectInputError("Type d’activité invalide.");
  const content = text(body, "content", 10000);
  if (!content) throw new ProspectInputError("Ajoutez une note sur cet échange.");
  const occurred_at = dateInput(body.occurred_at);
  if (!occurred_at || Date.parse(occurred_at) > Date.now() + 60000) throw new ProspectInputError("La date de l’échange doit être passée ou actuelle.");
  return { id: crypto.randomUUID(), kind: kind as ActivityKind, content, outcome: text(body, "outcome", 300), occurred_at, created_at: new Date().toISOString() };
}
