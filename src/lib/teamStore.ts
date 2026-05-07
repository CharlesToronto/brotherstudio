import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const TEAM_CLIENT_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "closed",
] as const;

export type TeamClientStatus = (typeof TEAM_CLIENT_STATUSES)[number];

export type TeamClientRecord = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  project: string;
  status: TeamClientStatus;
  nextFollowUp: string;
};

export type TeamNoteRecord = {
  id: string;
  clientId: string;
  content: string;
};

export type TeamScriptChoice = "yes" | "no" | "next" | "external" | "internal";

export type TeamScriptStep = {
  id: string;
  text: string;
  buttons: Array<{
    label: string;
    action: TeamScriptChoice;
    nextStepId?: string | null;
  }>;
};

export type TeamScriptRecord = {
  id: string;
  structure: TeamScriptStep[];
};

export type TeamQaRecord = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

const DEFAULT_SCRIPT_ID = "default";

export const DEFAULT_TEAM_SCRIPT: TeamScriptStep[] = [
  {
    id: "step_1",
    text: "Bonjour, [Prénom] de BrotherStudio. Est-ce que l'architecte en charge des projets est disponible ?",
    buttons: [
      { label: "Oui", action: "yes", nextStepId: "step_2" },
      { label: "Non", action: "no", nextStepId: "step_1b" },
    ],
  },
  {
    id: "step_1b",
    text: "Pas de souci. Quand puis-je le rappeler ? Je note un créneau.",
    buttons: [{ label: "Fin", action: "next", nextStepId: null }],
  },
  {
    id: "step_2",
    text: "Bonjour ! [Prénom] de BrotherStudio — on aide les architectes et promoteurs à vendre leurs projets plus facilement grâce à des visuels qui marquent les esprits.",
    buttons: [{ label: "Suivant", action: "next", nextStepId: "step_3" }],
  },
  {
    id: "step_3",
    text: "Est-ce que vous utilisez déjà des rendus 3D pour présenter vos projets ?",
    buttons: [
      { label: "Oui", action: "yes", nextStepId: "step_4" },
      { label: "Non", action: "no", nextStepId: "step_4b" },
    ],
  },
  {
    id: "step_4",
    text: "C'est fait en interne ou vous travaillez avec un studio externe ?",
    buttons: [
      { label: "Externe", action: "external", nextStepId: "step_5" },
      { label: "Interne", action: "internal", nextStepId: "step_5b" },
    ],
  },
  {
    id: "step_4b",
    text: "Est-ce qu'il vous arrive de perdre des clients faute de visuels convaincants ?",
    buttons: [
      { label: "Oui", action: "yes", nextStepId: "step_5" },
      { label: "Non", action: "no", nextStepId: "step_6b" },
    ],
  },
  {
    id: "step_5",
    text: "Vous avez un projet en cours en ce moment qui aurait besoin de visuels forts ?",
    buttons: [
      { label: "Oui", action: "yes", nextStepId: "step_6" },
      { label: "Non", action: "no", nextStepId: "step_6b" },
    ],
  },
  {
    id: "step_5b",
    text: "Est-ce que la qualité des rendus actuels vous satisfait pleinement, ou vous cherchez parfois mieux ?",
    buttons: [
      { label: "Cherche mieux", action: "yes", nextStepId: "step_6" },
      { label: "Satisfait", action: "no", nextStepId: "step_6b" },
    ],
  },
  {
    id: "step_6",
    text: "Je vous envoie 2–3 réalisations similaires à ce que vous faites — ça prend 30 secondes à regarder. Je peux ?",
    buttons: [
      { label: "Oui", action: "yes", nextStepId: "step_7" },
      { label: "Non", action: "no", nextStepId: "step_6c" },
    ],
  },
  {
    id: "step_6b",
    text: "Je comprends. Est-ce que je peux quand même vous envoyer quelques exemples, pour que vous ayez notre contact si un besoin se présente ?",
    buttons: [
      { label: "Oui", action: "yes", nextStepId: "step_7" },
      { label: "Non", action: "no", nextStepId: null },
    ],
  },
  {
    id: "step_6c",
    text: "Juste 2 images — si ça ne vous parle pas, vous supprimez. Je vous les envoie ?",
    buttons: [
      { label: "Ok", action: "yes", nextStepId: "step_7" },
      { label: "Non merci", action: "no", nextStepId: null },
    ],
  },
  {
    id: "step_7",
    text: "Parfait. C'est quoi le meilleur email pour vous joindre ?",
    buttons: [{ label: "Fin", action: "next", nextStepId: null }],
  },
];

export const DEFAULT_TEAM_QA: TeamQaRecord[] = [
  {
    id: "qa_1",
    question: "Quel est votre délai moyen ?",
    answer: "Cela dépend du volume et du type de visuels, mais nous pouvons qualifier rapidement le besoin pendant l’appel.",
    order: 0,
  },
  {
    id: "qa_2",
    question: "Travaillez-vous avec des studios et des promoteurs ?",
    answer: "Oui. L’outil est pensé pour les architectes, promoteurs et équipes commerciales qui ont besoin de mieux présenter leurs projets.",
    order: 1,
  },
  {
    id: "qa_3",
    question: "Pouvez-vous envoyer des exemples ?",
    answer: "Oui, l’objectif de fin d’appel est souvent d’obtenir le bon email pour envoyer 2 à 3 exemples ciblés.",
    order: 2,
  },
];

type TeamClientRow = {
  id: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  project: string | null;
  status: string | null;
  next_follow_up: string | null;
};

type TeamNoteRow = {
  id: string;
  client_id: string;
  content: string | null;
};

type TeamScriptRow = {
  id: string;
  structure: unknown;
};

type TeamQaRow = {
  id: string;
  question: string | null;
  answer: string | null;
  order: number | null;
};

function isMissingTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code.trim() : "";
  const combined = [candidate.message, candidate.details, candidate.hint]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();

  return code === "42P01" || code === "PGRST205" || combined.includes(tableName.toLowerCase());
}

function assertTeamConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
}

function normalizeTeamClientStatus(value: string | null | undefined): TeamClientStatus {
  return TEAM_CLIENT_STATUSES.includes(value as TeamClientStatus)
    ? (value as TeamClientStatus)
    : "new";
}

function normalizeClientRow(row: TeamClientRow): TeamClientRecord {
  return {
    id: row.id,
    name: row.name?.trim() ?? "",
    company: row.company?.trim() ?? "",
    phone: row.phone?.trim() ?? "",
    email: row.email?.trim() ?? "",
    project: row.project?.trim() ?? "",
    status: normalizeTeamClientStatus(row.status),
    nextFollowUp: row.next_follow_up?.trim() ?? "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeScriptStructure(value: unknown): TeamScriptStep[] {
  if (!Array.isArray(value)) return DEFAULT_TEAM_SCRIPT;

  const steps = value
    .map((entry): TeamScriptStep | null => {
      if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.text !== "string") {
        return null;
      }

      const buttons = Array.isArray(entry.buttons)
        ? entry.buttons
            .map((button) => {
              if (!isRecord(button) || typeof button.label !== "string") return null;
              const action = typeof button.action === "string" ? button.action : "next";
              return {
                label: button.label,
                action: action as TeamScriptChoice,
                nextStepId:
                  typeof button.nextStepId === "string" ? button.nextStepId : button.nextStepId === null ? null : undefined,
              };
            })
            .filter(Boolean) as TeamScriptStep["buttons"]
        : [];

      return {
        id: entry.id,
        text: entry.text,
        buttons,
      };
    })
    .filter((entry): entry is TeamScriptStep => Boolean(entry));

  return steps.length > 0 ? steps : DEFAULT_TEAM_SCRIPT;
}

function normalizeQaRow(row: TeamQaRow): TeamQaRecord {
  return {
    id: row.id,
    question: row.question?.trim() ?? "",
    answer: row.answer?.trim() ?? "",
    order: typeof row.order === "number" ? row.order : 0,
  };
}

export async function listTeamClients(): Promise<TeamClientRecord[]> {
  assertTeamConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("team_clients")
    .select("id, name, company, phone, email, project, status, next_follow_up")
    .order("name", { ascending: true });

  if (error) {
    if (isMissingTableError(error, "team_clients")) {
      throw new Error("Missing Supabase table: team_clients.");
    }
    throw error;
  }

  return (data ?? []).map((row) => normalizeClientRow(row as TeamClientRow));
}

export async function createTeamClient(input: Omit<TeamClientRecord, "id">) {
  assertTeamConfigured();
  const supabase = getSupabaseAdminClient();
  const payload = {
    name: input.name.trim(),
    company: input.company.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    project: input.project.trim(),
    status: normalizeTeamClientStatus(input.status),
    next_follow_up: input.nextFollowUp.trim() || null,
  };

  const { data, error } = await supabase
    .from("team_clients")
    .insert(payload)
    .select("id, name, company, phone, email, project, status, next_follow_up")
    .single();

  if (error) {
    if (isMissingTableError(error, "team_clients")) {
      throw new Error("Missing Supabase table: team_clients.");
    }
    throw error;
  }

  return normalizeClientRow(data as TeamClientRow);
}

export async function updateTeamClient(id: string, patch: Partial<Omit<TeamClientRecord, "id">>) {
  assertTeamConfigured();
  const supabase = getSupabaseAdminClient();
  const payload: Record<string, string | null> = {};

  if (typeof patch.name === "string") payload.name = patch.name.trim();
  if (typeof patch.company === "string") payload.company = patch.company.trim();
  if (typeof patch.phone === "string") payload.phone = patch.phone.trim();
  if (typeof patch.email === "string") payload.email = patch.email.trim();
  if (typeof patch.project === "string") payload.project = patch.project.trim();
  if (typeof patch.status === "string") payload.status = normalizeTeamClientStatus(patch.status);
  if (typeof patch.nextFollowUp === "string") {
    payload.next_follow_up = patch.nextFollowUp.trim() || null;
  }

  const { data, error } = await supabase
    .from("team_clients")
    .update(payload)
    .eq("id", id)
    .select("id, name, company, phone, email, project, status, next_follow_up")
    .single();

  if (error) {
    if (isMissingTableError(error, "team_clients")) {
      throw new Error("Missing Supabase table: team_clients.");
    }
    throw error;
  }

  return normalizeClientRow(data as TeamClientRow);
}

export async function getTeamNote(clientId: string): Promise<TeamNoteRecord> {
  assertTeamConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("team_notes")
    .select("id, client_id, content")
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error, "team_notes")) {
      throw new Error("Missing Supabase table: team_notes.");
    }
    throw error;
  }

  const row = data as TeamNoteRow | null;
  if (!row) {
    return {
      id: `draft:${clientId}`,
      clientId,
      content: "",
    };
  }

  return {
    id: row.id,
    clientId: row.client_id,
    content: row.content?.trim() ?? "",
  };
}

export async function upsertTeamNote(clientId: string, content: string) {
  assertTeamConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("team_notes")
    .upsert(
      {
        client_id: clientId,
        content,
      },
      { onConflict: "client_id" },
    )
    .select("id, client_id, content")
    .single();

  if (error) {
    if (isMissingTableError(error, "team_notes")) {
      throw new Error("Missing Supabase table: team_notes.");
    }
    throw error;
  }

  const row = data as TeamNoteRow;
  return {
    id: row.id,
    clientId: row.client_id,
    content: row.content?.trim() ?? "",
  };
}

export async function getTeamScript(): Promise<TeamScriptRecord> {
  assertTeamConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("team_scripts")
    .select("id, structure")
    .eq("id", DEFAULT_SCRIPT_ID)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error, "team_scripts")) {
      throw new Error("Missing Supabase table: team_scripts.");
    }
    throw error;
  }

  const row = data as TeamScriptRow | null;
  return {
    id: row?.id ?? DEFAULT_SCRIPT_ID,
    structure: normalizeScriptStructure(row?.structure ?? DEFAULT_TEAM_SCRIPT),
  };
}

export async function saveTeamScript(structure: TeamScriptStep[]) {
  assertTeamConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("team_scripts")
    .upsert(
      {
        id: DEFAULT_SCRIPT_ID,
        structure,
      },
      { onConflict: "id" },
    )
    .select("id, structure")
    .single();

  if (error) {
    if (isMissingTableError(error, "team_scripts")) {
      throw new Error("Missing Supabase table: team_scripts.");
    }
    throw error;
  }

  const row = data as TeamScriptRow;
  return {
    id: row.id,
    structure: normalizeScriptStructure(row.structure),
  };
}

export async function listTeamQa(): Promise<TeamQaRecord[]> {
  assertTeamConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("team_qa")
    .select("id, question, answer, order")
    .order("order", { ascending: true });

  if (error) {
    if (isMissingTableError(error, "team_qa")) {
      throw new Error("Missing Supabase table: team_qa.");
    }
    throw error;
  }

  if (!data || data.length === 0) return DEFAULT_TEAM_QA;
  return (data as TeamQaRow[]).map(normalizeQaRow);
}

export async function replaceTeamQa(items: TeamQaRecord[]) {
  assertTeamConfigured();
  const supabase = getSupabaseAdminClient();
  const { data: existingRows, error: listError } = await supabase
    .from("team_qa")
    .select("id");

  if (listError) {
    if (isMissingTableError(listError, "team_qa")) {
      throw new Error("Missing Supabase table: team_qa.");
    }
    throw listError;
  }

  const existingIds = new Set((existingRows ?? []).map((row) => String((row as { id: string }).id)));
  const nextIds = new Set(items.map((item) => item.id));
  const idsToDelete = Array.from(existingIds).filter((id) => !nextIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase.from("team_qa").delete().in("id", idsToDelete);
    if (deleteError) throw deleteError;
  }

  const payload = items.map((item, index) => ({
    id: item.id,
    question: item.question.trim(),
    answer: item.answer.trim(),
    order: index,
  }));

  const { data, error } = await supabase
    .from("team_qa")
    .upsert(payload, { onConflict: "id" })
    .select("id, question, answer, order")
    .order("order", { ascending: true });

  if (error) {
    if (isMissingTableError(error, "team_qa")) {
      throw new Error("Missing Supabase table: team_qa.");
    }
    throw error;
  }

  return (data as TeamQaRow[]).map(normalizeQaRow);
}
