"use client";

import { useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n";
import type {
  TeamClientRecord,
  TeamClientStatus,
  TeamQaRecord,
  TeamScriptStep,
} from "@/lib/teamStore";

type TeamCallWorkspaceProps = {
  locale: Locale;
};

type TeamNoteRecord = {
  id: string;
  clientId: string;
  content: string;
};

type TeamCopy = {
  title: string;
  subtitle: string;
  clientColumn: string;
  searchPlaceholder: string;
  newClient: string;
  scriptColumn: string;
  editScript: string;
  save: string;
  cancel: string;
  reset: string;
  notesColumn: string;
  notesLabel: string;
  notesPlaceholder: string;
  qaTitle: string;
  editQa: string;
  addQa: string;
  clientFields: {
    name: string;
    company: string;
    phone: string;
    email: string;
    project: string;
    status: string;
    nextFollowUp: string;
  };
  statuses: Record<TeamClientStatus, string>;
  emptyClients: string;
  noClientSelected: string;
  autosaving: string;
  saved: string;
  loading: string;
  endOfScript: string;
};

const copyByLocale: Record<Locale, TeamCopy> = {
  fr: {
    title: "Team Call Workspace",
    subtitle: "Un outil simple pour appeler, guider, noter et sauvegarder sans quitter la page.",
    clientColumn: "Client",
    searchPlaceholder: "Rechercher un client",
    newClient: "+ Nouveau client",
    scriptColumn: "Script guidé",
    editScript: "Edit Script",
    save: "Save",
    cancel: "Cancel",
    reset: "Reset",
    notesColumn: "Notes + Q&A",
    notesLabel: "Notes live",
    notesPlaceholder: "Notes d’appel, objections, email à confirmer, prochaines actions...",
    qaTitle: "Questions fréquentes",
    editQa: "Edit Q&A",
    addQa: "+ Ajouter",
    clientFields: {
      name: "Nom",
      company: "Entreprise",
      phone: "Téléphone",
      email: "Email",
      project: "Projet",
      status: "Statut",
      nextFollowUp: "Prochain suivi",
    },
    statuses: {
      new: "New",
      contacted: "Contacted",
      follow_up: "Follow-up",
      closed: "Closed",
    },
    emptyClients: "Aucun client pour l’instant.",
    noClientSelected: "Sélectionne un client pour écrire des notes et mettre à jour le suivi.",
    autosaving: "Enregistrement...",
    saved: "Sauvegardé",
    loading: "Chargement...",
    endOfScript: "Fin du script",
  },
  en: {
    title: "Team Call Workspace",
    subtitle: "A simple live-call workspace for clients, guided script, notes and useful answers.",
    clientColumn: "Client",
    searchPlaceholder: "Search a client",
    newClient: "+ New client",
    scriptColumn: "Guided script",
    editScript: "Edit Script",
    save: "Save",
    cancel: "Cancel",
    reset: "Reset",
    notesColumn: "Notes + Q&A",
    notesLabel: "Live notes",
    notesPlaceholder: "Call notes, objections, confirmed email, next actions...",
    qaTitle: "Frequently asked questions",
    editQa: "Edit Q&A",
    addQa: "+ Add",
    clientFields: {
      name: "Name",
      company: "Company",
      phone: "Phone",
      email: "Email",
      project: "Project",
      status: "Status",
      nextFollowUp: "Next follow-up",
    },
    statuses: {
      new: "New",
      contacted: "Contacted",
      follow_up: "Follow-up",
      closed: "Closed",
    },
    emptyClients: "No clients yet.",
    noClientSelected: "Select a client to write notes and update follow-up.",
    autosaving: "Saving...",
    saved: "Saved",
    loading: "Loading...",
    endOfScript: "End of script",
  },
};

const STATUSES: TeamClientStatus[] = ["new", "contacted", "follow_up", "closed"];

const emptyClientDraft = {
  name: "",
  company: "",
  phone: "",
  email: "",
  project: "",
  status: "new" as TeamClientStatus,
  nextFollowUp: "",
};

function createQaDraft(): TeamQaRecord {
  return {
    id: `qa_${crypto.randomUUID()}`,
    question: "",
    answer: "",
    order: 0,
  };
}

export function TeamCallWorkspace({ locale }: TeamCallWorkspaceProps) {
  const copy = copyByLocale[locale] ?? copyByLocale.en;
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [clients, setClients] = useState<TeamClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientDraft, setNewClientDraft] = useState(emptyClientDraft);
  const [notesByClientId, setNotesByClientId] = useState<Record<string, TeamNoteRecord>>({});
  const [notesStatus, setNotesStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [scriptSteps, setScriptSteps] = useState<TeamScriptStep[]>([]);
  const [activeScriptStepId, setActiveScriptStepId] = useState("");
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [scriptEditorValue, setScriptEditorValue] = useState("");
  const [qaItems, setQaItems] = useState<TeamQaRecord[]>([]);
  const [openQaId, setOpenQaId] = useState("");
  const [isEditingQa, setIsEditingQa] = useState(false);
  const [qaDraftItems, setQaDraftItems] = useState<TeamQaRecord[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [clientsResponse, scriptResponse, qaResponse] = await Promise.all([
          fetch("/api/team/clients", { cache: "no-store" }),
          fetch("/api/team/script", { cache: "no-store" }),
          fetch("/api/team/qa", { cache: "no-store" }),
        ]);

        if (!clientsResponse.ok) {
          throw new Error("Failed to load team clients.");
        }
        if (!scriptResponse.ok) {
          throw new Error("Failed to load team script.");
        }
        if (!qaResponse.ok) {
          throw new Error("Failed to load team Q&A.");
        }

        const clientsPayload = (await clientsResponse.json()) as { clients?: TeamClientRecord[] };
        const scriptPayload = (await scriptResponse.json()) as {
          script?: { structure?: TeamScriptStep[] };
        };
        const qaPayload = (await qaResponse.json()) as { items?: TeamQaRecord[] };

        if (isCancelled) return;

        const nextClients = clientsPayload.clients ?? [];
        const nextScriptSteps = scriptPayload.script?.structure ?? [];
        const nextQaItems = qaPayload.items ?? [];

        setClients(nextClients);
        setSelectedClientId((current) => current || nextClients[0]?.id || "");
        setScriptSteps(nextScriptSteps);
        setActiveScriptStepId(nextScriptSteps[0]?.id ?? "");
        setQaItems(nextQaItems);
        setOpenQaId(nextQaItems[0]?.id ?? "");
        setScriptEditorValue(JSON.stringify(nextScriptSteps, null, 2));
        setQaDraftItems(nextQaItems);
      } catch (error) {
        if (isCancelled) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load team workspace.");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspace();
    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) =>
      [client.name, client.company, client.email, client.project]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [clientSearch, clients]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const selectedClientNote = selectedClient ? notesByClientId[selectedClient.id]?.content ?? "" : "";
  const activeScriptStep = useMemo(
    () => scriptSteps.find((step) => step.id === activeScriptStepId) ?? null,
    [activeScriptStepId, scriptSteps],
  );

  useEffect(() => {
    if (!selectedClient || notesByClientId[selectedClient.id]) return;
    let isCancelled = false;
    const clientId = selectedClient.id;

    async function loadNote() {
      try {
        const response = await fetch(`/api/team/clients/${clientId}/note`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to load team note.");
        }
        const payload = (await response.json()) as { note?: TeamNoteRecord };
        if (isCancelled || !payload.note) return;
        setNotesByClientId((current) => ({
          ...current,
          [clientId]: payload.note!,
        }));
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load team note.");
        }
      }
    }

    void loadNote();
    return () => {
      isCancelled = true;
    };
  }, [notesByClientId, selectedClient]);

  useEffect(() => {
    if (!selectedClient) return;
    const note = notesByClientId[selectedClient.id];
    if (!note) return;

    setNotesStatus("idle");
    const timeout = window.setTimeout(async () => {
      setNotesStatus("saving");
      try {
        const response = await fetch(`/api/team/clients/${selectedClient.id}/note`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: note.content }),
        });
        if (!response.ok) {
          throw new Error("Failed to save team note.");
        }
        const payload = (await response.json()) as { note?: TeamNoteRecord };
        if (payload.note) {
          setNotesByClientId((current) => ({
            ...current,
            [selectedClient.id]: payload.note!,
          }));
        }
        setNotesStatus("saved");
      } catch (error) {
        setNotesStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Failed to save team note.");
      }
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [notesByClientId, selectedClient]);

  const handleCreateClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newClientDraft.name.trim()) return;
    setIsBusy(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/team/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newClientDraft),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to create client.");
      }
      const payload = (await response.json()) as { client?: TeamClientRecord };
      if (!payload.client) throw new Error("Failed to create client.");

      setClients((current) => [payload.client!, ...current]);
      setSelectedClientId(payload.client.id);
      setNewClientDraft(emptyClientDraft);
      setShowNewClientForm(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create client.");
    } finally {
      setIsBusy(false);
    }
  };

  const patchSelectedClient = async (patch: Partial<Omit<TeamClientRecord, "id">>) => {
    if (!selectedClient) return;
    const previous = selectedClient;
    const optimistic = { ...selectedClient, ...patch };
    setClients((current) =>
      current.map((client) => (client.id === selectedClient.id ? optimistic : client)),
    );

    try {
      const response = await fetch(`/api/team/clients/${selectedClient.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to update client.");
      }
      const payload = (await response.json()) as { client?: TeamClientRecord };
      if (payload.client) {
        setClients((current) =>
          current.map((client) => (client.id === selectedClient.id ? payload.client! : client)),
        );
      }
    } catch (error) {
      setClients((current) =>
        current.map((client) => (client.id === previous.id ? previous : client)),
      );
      setErrorMessage(error instanceof Error ? error.message : "Failed to update client.");
    }
  };

  const updateSelectedNote = (content: string) => {
    if (!selectedClient) return;
    setNotesByClientId((current) => ({
      ...current,
      [selectedClient.id]: {
        id: current[selectedClient.id]?.id ?? `draft:${selectedClient.id}`,
        clientId: selectedClient.id,
        content,
      },
    }));
  };

  const advanceScript = (nextStepId?: string | null) => {
    if (!nextStepId) {
      setActiveScriptStepId("");
      return;
    }
    setActiveScriptStepId(nextStepId);
  };

  const resetScript = () => {
    setActiveScriptStepId(scriptSteps[0]?.id ?? "");
  };

  const handleSaveScript = async () => {
    setIsBusy(true);
    setErrorMessage("");
    try {
      const parsed = JSON.parse(scriptEditorValue) as TeamScriptStep[];
      const response = await fetch("/api/team/script", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ structure: parsed }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to save script.");
      }
      const payload = (await response.json()) as { script?: { structure?: TeamScriptStep[] } };
      const nextSteps = payload.script?.structure ?? parsed;
      setScriptSteps(nextSteps);
      setScriptEditorValue(JSON.stringify(nextSteps, null, 2));
      setActiveScriptStepId(nextSteps[0]?.id ?? "");
      setIsEditingScript(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save script.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveQa = async () => {
    setIsBusy(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/team/qa", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: qaDraftItems }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to save Q&A.");
      }
      const payload = (await response.json()) as { items?: TeamQaRecord[] };
      const nextItems = payload.items ?? qaDraftItems;
      setQaItems(nextItems);
      setQaDraftItems(nextItems);
      setOpenQaId(nextItems[0]?.id ?? "");
      setIsEditingQa(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save Q&A.");
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <main className="siteMain teamPage">
        <section className="teamCallPage">
          <p className="teamCallLoading">{copy.loading}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="siteMain teamPage">
      <section className="teamCallPage">
        <header className="teamCallPageHeader">
          <div>
            <p className="projectFeedbackEyebrow">Team</p>
            <h1 className="projectFeedbackTitle">{copy.title}</h1>
            <p className="projectFeedbackVersionMeta">{copy.subtitle}</p>
          </div>
          {errorMessage ? <p className="projectFeedbackMessage projectFeedbackMessageError">{errorMessage}</p> : null}
        </header>

        <div className="teamCallGrid">
          <section className="teamCallColumn teamCallClientColumn">
            <div className="teamCallColumnHeader">
              <h2 className="teamCallColumnTitle">{copy.clientColumn}</h2>
              <button
                className="teamGhostButton"
                type="button"
                onClick={() => setShowNewClientForm((current) => !current)}
              >
                {copy.newClient}
              </button>
            </div>

            <input
              className="teamInput"
              type="search"
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder={copy.searchPlaceholder}
            />

            {showNewClientForm ? (
              <form className="teamCallInlineForm" onSubmit={handleCreateClient}>
                <input
                  className="teamInput"
                  type="text"
                  placeholder={copy.clientFields.name}
                  value={newClientDraft.name}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
                <input
                  className="teamInput"
                  type="text"
                  placeholder={copy.clientFields.company}
                  value={newClientDraft.company}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, company: event.target.value }))
                  }
                />
                <input
                  className="teamInput"
                  type="tel"
                  placeholder={copy.clientFields.phone}
                  value={newClientDraft.phone}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, phone: event.target.value }))
                  }
                />
                <input
                  className="teamInput"
                  type="email"
                  placeholder={copy.clientFields.email}
                  value={newClientDraft.email}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, email: event.target.value }))
                  }
                />
                <input
                  className="teamInput"
                  type="text"
                  placeholder={copy.clientFields.project}
                  value={newClientDraft.project}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, project: event.target.value }))
                  }
                />
                <div className="teamCallInlineRow">
                  <select
                    className="teamSelect"
                    value={newClientDraft.status}
                    onChange={(event) =>
                      setNewClientDraft((current) => ({
                        ...current,
                        status: event.target.value as TeamClientStatus,
                      }))
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {copy.statuses[status]}
                      </option>
                    ))}
                  </select>
                  <input
                    className="teamInput"
                    type="date"
                    value={newClientDraft.nextFollowUp}
                    onChange={(event) =>
                      setNewClientDraft((current) => ({
                        ...current,
                        nextFollowUp: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="teamCallInlineActions">
                  <button className="teamButton" type="submit" disabled={isBusy}>
                    {copy.save}
                  </button>
                  <button
                    className="teamGhostButton"
                    type="button"
                    onClick={() => {
                      setShowNewClientForm(false);
                      setNewClientDraft(emptyClientDraft);
                    }}
                  >
                    {copy.cancel}
                  </button>
                </div>
              </form>
            ) : null}

            <div className="teamCallClientList">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    className="teamCallClientCard"
                    type="button"
                    data-active={selectedClient?.id === client.id ? "true" : "false"}
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    <strong>{client.name}</strong>
                    <span>{client.company || client.project || client.email}</span>
                  </button>
                ))
              ) : (
                <p className="teamEmpty">{copy.emptyClients}</p>
              )}
            </div>

            {selectedClient ? (
              <div className="teamCallClientDetail">
                <label className="teamField">
                  <span className="teamFieldLabel">{copy.clientFields.status}</span>
                  <select
                    className="teamSelect"
                    value={selectedClient.status}
                    onChange={(event) =>
                      void patchSelectedClient({
                        status: event.target.value as TeamClientStatus,
                      })
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {copy.statuses[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.clientFields.nextFollowUp}</span>
                  <input
                    className="teamInput"
                    type="date"
                    value={selectedClient.nextFollowUp}
                    onChange={(event) =>
                      void patchSelectedClient({ nextFollowUp: event.target.value })
                    }
                  />
                </label>
              </div>
            ) : null}
          </section>

          <section className="teamCallColumn teamCallScriptColumn">
            <div className="teamCallColumnHeader">
              <h2 className="teamCallColumnTitle">{copy.scriptColumn}</h2>
              <button
                className="teamGhostButton"
                type="button"
                onClick={() => setIsEditingScript((current) => !current)}
              >
                {copy.editScript}
              </button>
            </div>

            {isEditingScript ? (
              <div className="teamCallEditorPanel">
                <textarea
                  className="teamTextarea teamCallEditorTextarea"
                  value={scriptEditorValue}
                  onChange={(event) => setScriptEditorValue(event.target.value)}
                />
                <div className="teamCallInlineActions">
                  <button className="teamButton" type="button" onClick={() => void handleSaveScript()} disabled={isBusy}>
                    {copy.save}
                  </button>
                  <button
                    className="teamGhostButton"
                    type="button"
                    onClick={() => {
                      setIsEditingScript(false);
                      setScriptEditorValue(JSON.stringify(scriptSteps, null, 2));
                    }}
                  >
                    {copy.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="teamCallScriptStage">
                {activeScriptStep ? (
                  <>
                    <p className="teamCallScriptText">{activeScriptStep.text}</p>
                    <div className="teamCallScriptActions">
                      {activeScriptStep.buttons.map((button) => (
                        <button
                          key={`${activeScriptStep.id}-${button.label}`}
                          className="teamButton"
                          type="button"
                          onClick={() => advanceScript(button.nextStepId)}
                        >
                          {button.label}
                        </button>
                      ))}
                      <button className="teamGhostButton" type="button" onClick={resetScript}>
                        {copy.reset}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="teamEmpty">{copy.endOfScript}</p>
                )}
              </div>
            )}
          </section>

          <section className="teamCallColumn teamCallNotesColumn">
            <div className="teamCallColumnHeader">
              <h2 className="teamCallColumnTitle">{copy.notesColumn}</h2>
            </div>

            <label className="teamField">
              <span className="teamFieldLabel">{copy.notesLabel}</span>
              <textarea
                className="teamTextarea teamCallNotesTextarea"
                placeholder={copy.notesPlaceholder}
                value={selectedClientNote}
                onChange={(event) => updateSelectedNote(event.target.value)}
                disabled={!selectedClient}
              />
            </label>

            <p className="teamCallAutosaveMeta">
              {!selectedClient
                ? copy.noClientSelected
                : notesStatus === "saving"
                  ? copy.autosaving
                  : notesStatus === "saved"
                    ? copy.saved
                    : null}
            </p>

            <div className="teamCallColumnHeader teamCallColumnHeaderInline">
              <h3 className="teamCallSubTitle">{copy.qaTitle}</h3>
              <button
                className="teamGhostButton"
                type="button"
                onClick={() => setIsEditingQa((current) => !current)}
              >
                {copy.editQa}
              </button>
            </div>

            {isEditingQa ? (
              <div className="teamCallEditorPanel">
                {qaDraftItems.map((item, index) => (
                  <div key={item.id} className="teamCallQaEditorItem">
                    <input
                      className="teamInput"
                      type="text"
                      value={item.question}
                      placeholder="Question"
                      onChange={(event) =>
                        setQaDraftItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, question: event.target.value, order: index } : entry,
                          ),
                        )
                      }
                    />
                    <textarea
                      className="teamTextarea"
                      value={item.answer}
                      placeholder="Réponse"
                      onChange={(event) =>
                        setQaDraftItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, answer: event.target.value, order: index } : entry,
                          ),
                        )
                      }
                    />
                  </div>
                ))}

                <div className="teamCallInlineActions">
                  <button
                    className="teamGhostButton"
                    type="button"
                    onClick={() => setQaDraftItems((current) => [...current, createQaDraft()])}
                  >
                    {copy.addQa}
                  </button>
                  <button className="teamButton" type="button" onClick={() => void handleSaveQa()} disabled={isBusy}>
                    {copy.save}
                  </button>
                  <button
                    className="teamGhostButton"
                    type="button"
                    onClick={() => {
                      setIsEditingQa(false);
                      setQaDraftItems(qaItems);
                    }}
                  >
                    {copy.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="teamCallQaList">
                {qaItems.map((item) => (
                  <article key={item.id} className="teamCallQaItem">
                    <button
                      className="teamCallQaQuestion"
                      type="button"
                      onClick={() => setOpenQaId((current) => (current === item.id ? "" : item.id))}
                    >
                      <span>{item.question}</span>
                      <span>{openQaId === item.id ? "−" : "+"}</span>
                    </button>
                    {openQaId === item.id ? (
                      <div className="teamCallQaAnswer">
                        <p>{item.answer}</p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
