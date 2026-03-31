"use client";

import { useEffect, useState } from "react";

import type { Locale } from "@/lib/i18n";

const TEAM_STORAGE_KEY = "brotherstudio-team-workspace-v1";
const CLIENT_STATUSES = [
  "new",
  "attempting",
  "follow_up",
  "qualified",
  "proposal",
  "closed",
] as const;

type TeamClientStatus = (typeof CLIENT_STATUSES)[number];

type TeamTodoItem = {
  id: string;
  text: string;
  done: boolean;
};

type TeamClient = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  project: string;
  status: TeamClientStatus;
  lastCall: string;
  nextFollowUp: string;
  notes: string;
};

type TeamStoragePayload = {
  quickNote: string;
  todos: TeamTodoItem[];
  clients: TeamClient[];
};

type TeamCopy = {
  notesTitle: string;
  notesIntro: string;
  quickNotesLabel: string;
  quickNotesPlaceholder: string;
  todoLabel: string;
  todoPlaceholder: string;
  addTodoLabel: string;
  emptyTodos: string;
  clientsTitle: string;
  clientsIntro: string;
  addClientTitle: string;
  addClientLabel: string;
  emptyClients: string;
  removeLabel: string;
  unnamedClient: string;
  labels: {
    name: string;
    company: string;
    phone: string;
    email: string;
    project: string;
    status: string;
    lastCall: string;
    nextFollowUp: string;
    notes: string;
  };
  statusLabels: Record<TeamClientStatus, string>;
  scriptSections: Array<{
    title: string;
    blocks: Array<{
      label: string;
      text: string;
    }>;
  }>;
};

const copyByLocale = {
  fr: {
    notesTitle: "Notes & To-do",
    notesIntro:
      "Gardez un bloc-note rapide et une liste d'actions a faire entre les appels.",
    quickNotesLabel: "Notes rapides",
    quickNotesPlaceholder:
      "Ex: client interesse par 4 rendus exterieurs, envoyer exemples apres l'appel.",
    todoLabel: "Nouvelle tache",
    todoPlaceholder: "Ex: rappeler Marc mardi a 14h",
    addTodoLabel: "Ajouter",
    emptyTodos: "Aucune tache pour l'instant.",
    clientsTitle: "Clients & Follow-up",
    clientsIntro:
      "Ajoutez les prospects, modifiez leurs infos, puis gardez les dates et notes de suivi a jour.",
    addClientTitle: "Ajouter un client",
    addClientLabel: "Ajouter le client",
    emptyClients: "Aucun client ajoute pour l'instant.",
    removeLabel: "Supprimer",
    unnamedClient: "Client sans nom",
    labels: {
      name: "Nom",
      company: "Entreprise",
      phone: "Telephone",
      email: "Courriel",
      project: "Projet",
      status: "Statut",
      lastCall: "Dernier appel",
      nextFollowUp: "Prochain suivi",
      notes: "Notes d'appel / prochaines actions",
    },
    statusLabels: {
      new: "Nouveau",
      attempting: "Tentative",
      follow_up: "Follow-up",
      qualified: "Qualifie",
      proposal: "Proposition",
      closed: "Clos",
    },
    scriptSections: [
      {
        title: "Ouverture d'appel",
        blocks: [
          {
            label: "Script",
            text:
              "Bonjour [Nom], ici [Votre prenom] de BrotherStudio. Je vous appelle rapidement parce qu'on aide les architectes et developpeurs a mieux presenter et vendre leurs projets grace a des visualisations haut de gamme. Est-ce que vous avez 30 secondes ?",
          },
        ],
      },
      {
        title: "Qualification rapide",
        blocks: [
          {
            label: "Questions",
            text:
              "Sur quel type de projet travaillez-vous en ce moment ?\nAvez-vous besoin de visuels pour une presentation, une approbation ou la vente ?\nEst-ce que vous avez deja des rendus ou il faut tout creer a partir des plans ?",
          },
          {
            label: "But",
            text:
              "Comprendre le type de projet, l'urgence et si la visualisation sert surtout a convaincre, vendre ou clarifier la direction du projet.",
          },
        ],
      },
      {
        title: "Objections frequentes",
        blocks: [
          {
            label: "On a deja quelqu'un",
            text:
              "Je comprends. Beaucoup de studios gardent un partenaire principal et nous utilisent quand ils ont besoin d'un autre style, d'un renfort rapide ou d'images plus orientees vente.",
          },
          {
            label: "Envoyez-moi un email",
            text:
              "Avec plaisir. Pour vous envoyer quelque chose de pertinent, quel type de projet ou de rendu vous interesserait le plus en ce moment ?",
          },
          {
            label: "Pas maintenant",
            text:
              "Pas de probleme. Quel serait le meilleur moment pour refaire un point: la semaine prochaine ou plutot le mois prochain ?",
          },
        ],
      },
      {
        title: "Q&A utile",
        blocks: [
          {
            label: "Q: Que livrez-vous ?",
            text:
              "Des images photorealistes, rendus exterieurs et interieurs, floor plans marketing, videos et visuels de presentation.",
          },
          {
            label: "Q: De quoi avez-vous besoin pour commencer ?",
            text:
              "Idealement les plans PDF, elevations, references de materiaux et toute image d'inspiration qui aide a cadrer l'ambiance.",
          },
          {
            label: "Q: Quel est l'objectif de l'appel ?",
            text:
              "Valider s'il y a un projet actif ou a venir, puis ouvrir une prochaine etape claire: envoi d'exemples, devis ou second appel.",
          },
        ],
      },
    ],
  },
  en: {
    notesTitle: "Notes & To-do",
    notesIntro:
      "Keep a quick note area and a short action list between calls.",
    quickNotesLabel: "Quick notes",
    quickNotesPlaceholder:
      "Example: prospect interested in 4 exterior views, send samples after the call.",
    todoLabel: "New task",
    todoPlaceholder: "Example: call Marc back Tuesday at 2 PM",
    addTodoLabel: "Add",
    emptyTodos: "No tasks yet.",
    clientsTitle: "Clients & Follow-up",
    clientsIntro:
      "Add prospects, update their info, and keep follow-up dates and call notes current.",
    addClientTitle: "Add a client",
    addClientLabel: "Add client",
    emptyClients: "No clients added yet.",
    removeLabel: "Remove",
    unnamedClient: "Unnamed client",
    labels: {
      name: "Name",
      company: "Company",
      phone: "Phone",
      email: "Email",
      project: "Project",
      status: "Status",
      lastCall: "Last call",
      nextFollowUp: "Next follow-up",
      notes: "Call notes / next actions",
    },
    statusLabels: {
      new: "New",
      attempting: "Attempting",
      follow_up: "Follow-up",
      qualified: "Qualified",
      proposal: "Proposal",
      closed: "Closed",
    },
    scriptSections: [
      {
        title: "Opening script",
        blocks: [
          {
            label: "Script",
            text:
              "Hi [Name], this is [Your name] from BrotherStudio. I am reaching out because we help architects and developers present and sell their projects through high-end visualizations. Do you have 30 seconds?",
          },
        ],
      },
      {
        title: "Quick qualification",
        blocks: [
          {
            label: "Questions",
            text:
              "What kind of project are you working on right now?\nDo you need visuals for presentation, approvals, or sales?\nDo you already have renderings, or would everything start from the plans?",
          },
          {
            label: "Goal",
            text:
              "Understand the project type, timing, and whether the visuals are mainly for selling, presenting, or clarifying the design direction.",
          },
        ],
      },
      {
        title: "Common objections",
        blocks: [
          {
            label: "We already have someone",
            text:
              "That makes sense. Many studios keep their main partner and still use us when they need a different visual style, extra capacity, or more sales-focused images.",
          },
          {
            label: "Send me an email",
            text:
              "Absolutely. To make it useful, what kind of project or visuals would be most relevant for you right now?",
          },
          {
            label: "Not now",
            text:
              "No problem. When would be better to reconnect: next week or later next month?",
          },
        ],
      },
      {
        title: "Helpful Q&A",
        blocks: [
          {
            label: "Q: What do you deliver?",
            text:
              "Photorealistic images, exterior and interior renderings, marketing floor plans, videos, and presentation visuals.",
          },
          {
            label: "Q: What do you need to start?",
            text:
              "Ideally PDF plans, elevations, material references, and any inspiration images that help define the mood.",
          },
          {
            label: "Q: What is the call trying to achieve?",
            text:
              "Confirm whether there is an active or upcoming project, then secure a clear next step: sample email, quote, or a second call.",
          },
        ],
      },
    ],
  },
} satisfies Record<Locale, TeamCopy>;

const emptyClientDraft = {
  name: "",
  company: "",
  phone: "",
  email: "",
  project: "",
  status: "new" as TeamClientStatus,
  nextFollowUp: "",
};

const emptyStore: TeamStoragePayload = {
  quickNote: "",
  todos: [],
  clients: [],
};

function getCopy(locale: Locale) {
  return copyByLocale[locale];
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isClientStatus(value: unknown): value is TeamClientStatus {
  return (
    typeof value === "string" &&
    (CLIENT_STATUSES as readonly string[]).includes(value)
  );
}

function normalizeTodo(value: unknown): TeamTodoItem | null {
  if (!isRecord(value) || typeof value.text !== "string") return null;

  return {
    id: typeof value.id === "string" ? value.id : createId(),
    text: value.text,
    done: value.done === true,
  };
}

function normalizeClient(value: unknown): TeamClient | null {
  if (!isRecord(value)) return null;

  return {
    id: typeof value.id === "string" ? value.id : createId(),
    name: typeof value.name === "string" ? value.name : "",
    company: typeof value.company === "string" ? value.company : "",
    phone: typeof value.phone === "string" ? value.phone : "",
    email: typeof value.email === "string" ? value.email : "",
    project: typeof value.project === "string" ? value.project : "",
    status: isClientStatus(value.status) ? value.status : "new",
    lastCall: typeof value.lastCall === "string" ? value.lastCall : "",
    nextFollowUp:
      typeof value.nextFollowUp === "string" ? value.nextFollowUp : "",
    notes: typeof value.notes === "string" ? value.notes : "",
  };
}

function readStore(): TeamStoragePayload {
  if (typeof window === "undefined") return emptyStore;

  try {
    const stored = window.localStorage.getItem(TEAM_STORAGE_KEY);
    if (!stored) return emptyStore;

    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed)) return emptyStore;

    return {
      quickNote: typeof parsed.quickNote === "string" ? parsed.quickNote : "",
      todos: Array.isArray(parsed.todos)
        ? parsed.todos
            .map(normalizeTodo)
            .filter((item): item is TeamTodoItem => item !== null)
        : [],
      clients: Array.isArray(parsed.clients)
        ? parsed.clients
            .map(normalizeClient)
            .filter((item): item is TeamClient => item !== null)
        : [],
    };
  } catch {
    return emptyStore;
  }
}

function writeStore(patch: Partial<TeamStoragePayload>) {
  const current = readStore();
  const next: TeamStoragePayload = {
    ...current,
    ...patch,
  };

  window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(next));
}

function useTeamClients() {
  const [clients, setClients] = useState<TeamClient[]>([]);
  const [clientDraft, setClientDraft] = useState(emptyClientDraft);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const store = readStore();
      setClients(store.clients);
      setHasLoaded(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    writeStore({ clients });
  }, [clients, hasLoaded]);

  const addClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = clientDraft.name.trim();
    if (!name) return;

    setClients((current) => [
      {
        id: createId(),
        name,
        company: clientDraft.company.trim(),
        phone: clientDraft.phone.trim(),
        email: clientDraft.email.trim(),
        project: clientDraft.project.trim(),
        status: clientDraft.status,
        lastCall: "",
        nextFollowUp: clientDraft.nextFollowUp,
        notes: "",
      },
      ...current,
    ]);

    setClientDraft(emptyClientDraft);
  };

  const updateClient = (id: string, patch: Partial<TeamClient>) => {
    setClients((current) =>
      current.map((client) => (client.id === id ? { ...client, ...patch } : client)),
    );
  };

  const removeClient = (id: string) => {
    setClients((current) => current.filter((client) => client.id !== id));
  };

  return {
    clients,
    clientDraft,
    setClientDraft,
    addClient,
    updateClient,
    removeClient,
  };
}

function useTeamNotes() {
  const [quickNote, setQuickNote] = useState("");
  const [todoDraft, setTodoDraft] = useState("");
  const [todos, setTodos] = useState<TeamTodoItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const store = readStore();
      setQuickNote(store.quickNote);
      setTodos(store.todos);
      setHasLoaded(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    writeStore({ quickNote, todos });
  }, [hasLoaded, quickNote, todos]);

  const addTodo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = todoDraft.trim();
    if (!text) return;

    setTodos((current) => [{ id: createId(), text, done: false }, ...current]);
    setTodoDraft("");
  };

  const removeTodo = (id: string) => {
    setTodos((current) => current.filter((item) => item.id !== id));
  };

  return {
    quickNote,
    setQuickNote,
    todoDraft,
    setTodoDraft,
    todos,
    setTodos,
    addTodo,
    removeTodo,
  };
}

export function TeamClientsPanel({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const {
    clients,
    clientDraft,
    setClientDraft,
    addClient,
    updateClient,
    removeClient,
  } = useTeamClients();

  return (
    <section className="teamPanel teamPanelWide" aria-labelledby="teamClientsTitle">
      <div className="teamPanelHeader">
        <h1 id="teamClientsTitle" className="teamPanelTitle">
          {copy.clientsTitle}
        </h1>
        <p className="teamPanelText">{copy.clientsIntro}</p>
      </div>

      <form className="teamClientForm" onSubmit={addClient}>
        <div className="teamClientFormHeader">
          <h2 className="teamClientFormTitle">{copy.addClientTitle}</h2>
          <button className="teamButton" type="submit">
            {copy.addClientLabel}
          </button>
        </div>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.name}</span>
          <input
            className="teamInput"
            type="text"
            value={clientDraft.name}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            required
          />
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.company}</span>
          <input
            className="teamInput"
            type="text"
            value={clientDraft.company}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                company: event.target.value,
              }))
            }
          />
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.phone}</span>
          <input
            className="teamInput"
            type="tel"
            value={clientDraft.phone}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
          />
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.email}</span>
          <input
            className="teamInput"
            type="email"
            value={clientDraft.email}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
          />
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.project}</span>
          <input
            className="teamInput"
            type="text"
            value={clientDraft.project}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                project: event.target.value,
              }))
            }
          />
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.status}</span>
          <select
            className="teamSelect"
            value={clientDraft.status}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                status: event.target.value as TeamClientStatus,
              }))
            }
          >
            {CLIENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {copy.statusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.nextFollowUp}</span>
          <input
            className="teamInput"
            type="date"
            value={clientDraft.nextFollowUp}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                nextFollowUp: event.target.value,
              }))
            }
          />
        </label>
      </form>

      {clients.length > 0 ? (
        <div className="teamClientList">
          {clients.map((client) => (
            <article key={client.id} className="teamClientCard">
              <div className="teamClientCardHeader">
                <div className="teamClientIdentity">
                  <h2 className="teamClientName">
                    {client.name || copy.unnamedClient}
                  </h2>
                  <p className="teamClientMeta">
                    {client.company || client.project || copy.statusLabels[client.status]}
                  </p>
                </div>

                <button
                  className="teamGhostButton"
                  type="button"
                  onClick={() => removeClient(client.id)}
                >
                  {copy.removeLabel}
                </button>
              </div>

              <div className="teamClientGrid">
                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.name}</span>
                  <input
                    className="teamInput"
                    type="text"
                    value={client.name}
                    onChange={(event) =>
                      updateClient(client.id, { name: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.company}</span>
                  <input
                    className="teamInput"
                    type="text"
                    value={client.company}
                    onChange={(event) =>
                      updateClient(client.id, { company: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.phone}</span>
                  <input
                    className="teamInput"
                    type="tel"
                    value={client.phone}
                    onChange={(event) =>
                      updateClient(client.id, { phone: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.email}</span>
                  <input
                    className="teamInput"
                    type="email"
                    value={client.email}
                    onChange={(event) =>
                      updateClient(client.id, { email: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.project}</span>
                  <input
                    className="teamInput"
                    type="text"
                    value={client.project}
                    onChange={(event) =>
                      updateClient(client.id, { project: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.status}</span>
                  <select
                    className="teamSelect"
                    value={client.status}
                    onChange={(event) =>
                      updateClient(client.id, {
                        status: event.target.value as TeamClientStatus,
                      })
                    }
                  >
                    {CLIENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {copy.statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.lastCall}</span>
                  <input
                    className="teamInput"
                    type="date"
                    value={client.lastCall}
                    onChange={(event) =>
                      updateClient(client.id, { lastCall: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.nextFollowUp}</span>
                  <input
                    className="teamInput"
                    type="date"
                    value={client.nextFollowUp}
                    onChange={(event) =>
                      updateClient(client.id, {
                        nextFollowUp: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="teamField teamFieldWide">
                  <span className="teamFieldLabel">{copy.labels.notes}</span>
                  <textarea
                    className="teamTextarea"
                    value={client.notes}
                    onChange={(event) =>
                      updateClient(client.id, { notes: event.target.value })
                    }
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="teamEmpty">{copy.emptyClients}</p>
      )}
    </section>
  );
}

export function TeamScriptPanel({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);

  return (
    <section className="teamPanel" aria-labelledby="teamScriptTitle">
      <div className="teamPanelHeader">
        <h1 id="teamScriptTitle" className="teamPanelTitle">
          Script
        </h1>
      </div>

      <div className="teamAccordionList">
        {copy.scriptSections.map((section, index) => (
          <details key={section.title} className="teamAccordion" open={index === 0}>
            <summary className="teamAccordionSummary">{section.title}</summary>
            <div className="teamAccordionBody">
              {section.blocks.map((block) => (
                <section key={block.label} className="teamScriptBlock">
                  <h2 className="teamScriptLabel">{block.label}</h2>
                  {block.text.split("\n").map((line) => (
                    <p key={line} className="teamScriptText">
                      {line}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function TeamNotesPanel({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const {
    quickNote,
    setQuickNote,
    todoDraft,
    setTodoDraft,
    todos,
    setTodos,
    addTodo,
    removeTodo,
  } = useTeamNotes();

  return (
    <section className="teamPanel" aria-labelledby="teamNotesTitle">
      <div className="teamPanelHeader">
        <h1 id="teamNotesTitle" className="teamPanelTitle">
          {copy.notesTitle}
        </h1>
        <p className="teamPanelText">{copy.notesIntro}</p>
      </div>

      <label className="teamField">
        <span className="teamFieldLabel">{copy.quickNotesLabel}</span>
        <textarea
          className="teamTextarea"
          value={quickNote}
          onChange={(event) => setQuickNote(event.target.value)}
          placeholder={copy.quickNotesPlaceholder}
        />
      </label>

      <form className="teamInlineForm" onSubmit={addTodo}>
        <label className="teamField">
          <span className="teamFieldLabel">{copy.todoLabel}</span>
          <input
            className="teamInput"
            type="text"
            value={todoDraft}
            onChange={(event) => setTodoDraft(event.target.value)}
            placeholder={copy.todoPlaceholder}
          />
        </label>
        <button className="teamButton" type="submit">
          {copy.addTodoLabel}
        </button>
      </form>

      {todos.length > 0 ? (
        <ul className="teamTodoList">
          {todos.map((item) => (
            <li key={item.id} className="teamTodoItem">
              <label className="teamTodoCheck">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(event) =>
                    setTodos((current) =>
                      current.map((todo) =>
                        todo.id === item.id
                          ? { ...todo, done: event.target.checked }
                          : todo,
                      ),
                    )
                  }
                />
                <span data-done={item.done}>{item.text}</span>
              </label>
              <button
                className="teamGhostButton"
                type="button"
                onClick={() => removeTodo(item.id)}
              >
                {copy.removeLabel}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="teamEmpty">{copy.emptyTodos}</p>
      )}
    </section>
  );
}
