"use client";

import { useMemo, useState } from "react";

import { AdminLockOverlay } from "@/components/AdminLockOverlay";

type ProjectStatus = "Réalisé" | "En cours" | "À venir" | "En attente";
type Currency = "CAD" | "CHF";

type Project = {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectName: string;
  status: ProjectStatus;
  invoicedAmount: number;
  upcomingAmount: number;
  expectedDate: string;
  currency: Currency;
};

const statusStyles: Record<ProjectStatus, string> = {
  Réalisé: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "En cours": "bg-amber-50 text-amber-700 border border-amber-200",
  "À venir": "bg-sky-50 text-sky-700 border border-sky-200",
  "En attente": "bg-neutral-100 text-neutral-700 border border-neutral-200",
};

const statusOptions: ProjectStatus[] = ["Réalisé", "En cours", "À venir", "En attente"];
const currencyOptions: Currency[] = ["CAD", "CHF"];

const initialProjects: Project[] = [
  {
    id: 1,
    clientName: "Cerita Miller",
    clientEmail: "cerita@lighthouse.com",
    clientPhone: "+1 647 555 0184",
    projectName: "The Lighthouse",
    status: "Réalisé",
    invoicedAmount: 3200,
    upcomingAmount: 0,
    expectedDate: "2026-05-27",
    currency: "CAD",
  },
  {
    id: 2,
    clientName: "Architecte Suisse",
    clientEmail: "contact@architecte-suisse.ch",
    clientPhone: "+41 79 555 11 28",
    projectName: "Chalet Haute-Nendaz",
    status: "En cours",
    invoicedAmount: 1500,
    upcomingAmount: 4500,
    expectedDate: "2026-06-15",
    currency: "CHF",
  },
  {
    id: 3,
    clientName: "Promoteur immobilier",
    clientEmail: "hello@promo-gland.ch",
    clientPhone: "+41 22 555 02 16",
    projectName: "Résidence Gland",
    status: "À venir",
    invoicedAmount: 0,
    upcomingAmount: 7000,
    expectedDate: "2026-07-01",
    currency: "CHF",
  },
  {
    id: 4,
    clientName: "Maison Atlas",
    clientEmail: "atlas@maisonatlas.ca",
    clientPhone: "+1 514 555 0091",
    projectName: "Villa Montcalm",
    status: "Réalisé",
    invoicedAmount: 5400,
    upcomingAmount: 0,
    expectedDate: "2026-04-18",
    currency: "CAD",
  },
  {
    id: 5,
    clientName: "Studio Laurent",
    clientEmail: "bonjour@studiolaurent.ch",
    clientPhone: "+41 76 555 44 89",
    projectName: "Penthouse Lausanne",
    status: "En attente",
    invoicedAmount: 0,
    upcomingAmount: 3800,
    expectedDate: "2026-08-08",
    currency: "CHF",
  },
  {
    id: 6,
    clientName: "Julien Mercier",
    clientEmail: "julien@mercier.ca",
    clientPhone: "+1 438 555 1032",
    projectName: "Maison du Lac",
    status: "En cours",
    invoicedAmount: 2100,
    upcomingAmount: 2900,
    expectedDate: "2026-06-28",
    currency: "CAD",
  },
];

function createEmptyProject(nextId: number): Project {
  return {
    id: nextId,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    projectName: "",
    status: "À venir",
    invoicedAmount: 0,
    upcomingAmount: 0,
    expectedDate: "",
    currency: "CAD",
  };
}

function formatCurrency(amount: number, currency: Currency) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  if (!value) return "Date à définir";

  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function sumByCurrency(
  items: Project[],
  selector: (project: Project) => number,
): Record<Currency, number> {
  return items.reduce<Record<Currency, number>>(
    (totals, project) => {
      totals[project.currency] += selector(project);
      return totals;
    },
    { CAD: 0, CHF: 0 },
  );
}

function renderCurrencySummary(
  totals: Record<Currency, number>,
  emptyLabel = "Aucun montant",
) {
  const entries = (Object.entries(totals) as [Currency, number][])
    .filter(([, amount]) => amount > 0);

  if (entries.length === 0) {
    return <p className="text-sm text-neutral-400">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([currency, amount]) => (
        <div key={currency} className="flex items-baseline justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
            {currency}
          </span>
          <span className="text-xl font-semibold text-neutral-950">
            {formatCurrency(amount, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DashboardField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function DashboardInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 ${
        props.className ?? ""
      }`}
    />
  );
}

function DashboardSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 ${
        props.className ?? ""
      }`}
    />
  );
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Project | null>(null);

  const clientsCount = useMemo(
    () => new Set(projects.map((project) => project.clientEmail.trim().toLowerCase())).size,
    [projects],
  );

  const completedProjects = useMemo(
    () => projects.filter((project) => project.status === "Réalisé"),
    [projects],
  );

  const upcomingProjects = useMemo(
    () =>
      projects.filter(
        (project) => project.status === "À venir" || project.status === "En attente",
      ),
    [projects],
  );

  const totalInvoiced = useMemo(
    () => sumByCurrency(projects, (project) => project.invoicedAmount),
    [projects],
  );
  const totalUpcoming = useMemo(
    () => sumByCurrency(projects, (project) => project.upcomingAmount),
    [projects],
  );
  const totalProjected = useMemo(
    () =>
      sumByCurrency(
        projects,
        (project) => project.invoicedAmount + project.upcomingAmount,
      ),
    [projects],
  );

  const stats = [
    { label: "Clients", value: clientsCount },
    { label: "Projets", value: projects.length },
    { label: "Réalisés", value: completedProjects.length },
    { label: "À venir", value: upcomingProjects.length },
  ] as const;

  const startAdd = () => {
    const nextId = projects.reduce((max, project) => Math.max(max, project.id), 0) + 1;
    setDraft(createEmptyProject(nextId));
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (project: Project) => {
    setDraft({ ...project });
    setEditingId(project.id);
    setIsAdding(false);
  };

  const cancelDraft = () => {
    setDraft(null);
    setEditingId(null);
    setIsAdding(false);
  };

  const saveDraft = () => {
    if (!draft) return;

    const normalizedProject: Project = {
      ...draft,
      clientName: draft.clientName.trim(),
      clientEmail: draft.clientEmail.trim(),
      clientPhone: draft.clientPhone.trim(),
      projectName: draft.projectName.trim(),
      expectedDate: draft.expectedDate,
      invoicedAmount: Number.isFinite(draft.invoicedAmount) ? draft.invoicedAmount : 0,
      upcomingAmount: Number.isFinite(draft.upcomingAmount) ? draft.upcomingAmount : 0,
    };

    if (
      !normalizedProject.clientName ||
      !normalizedProject.clientEmail ||
      !normalizedProject.projectName ||
      !normalizedProject.expectedDate
    ) {
      return;
    }

    if (isAdding) {
      setProjects((current) => [normalizedProject, ...current]);
    } else if (editingId !== null) {
      setProjects((current) =>
        current.map((project) => (project.id === editingId ? normalizedProject : project)),
      );
    }

    cancelDraft();
  };

  const deleteProject = (projectId: number) => {
    setProjects((current) => current.filter((project) => project.id !== projectId));
    if (editingId === projectId) {
      cancelDraft();
    }
  };

  const updateDraft = <K extends keyof Project>(key: K, value: Project[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-neutral-950">
      <AdminLockOverlay title="Accès Dashboard" storageKey="bs_dashboard_unlocked" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
            Admin Dashboard
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-5xl">
            Dashboard
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Vue rapide des clients, projets et projections financières.
          </p>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_10px_26px_rgba(15,23,42,0.04)]"
            >
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
              Projection financière
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
              Total déjà facturé
            </h2>
            <div className="mt-6">{renderCurrencySummary(totalInvoiced)}</div>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
              Projection financière
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
              Total à facturer plus tard
            </h2>
            <div className="mt-6">{renderCurrencySummary(totalUpcoming)}</div>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
              Projection financière
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
              Projection totale
            </h2>
            <div className="mt-6">{renderCurrencySummary(totalProjected)}</div>
          </article>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
                Vue d&apos;ensemble
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                Liste des clients / projets
              </h2>
            </div>

            <button
              type="button"
              onClick={startAdd}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Ajouter un projet
            </button>
          </div>

          {draft && (isAdding || editingId !== null) ? (
            <div className="mb-4 rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DashboardField label="Client">
                  <DashboardInput
                    value={draft.clientName}
                    onChange={(event) => updateDraft("clientName", event.target.value)}
                    placeholder="Nom du client"
                  />
                </DashboardField>
                <DashboardField label="Email">
                  <DashboardInput
                    value={draft.clientEmail}
                    onChange={(event) => updateDraft("clientEmail", event.target.value)}
                    type="email"
                    placeholder="client@email.com"
                  />
                </DashboardField>
                <DashboardField label="Téléphone">
                  <DashboardInput
                    value={draft.clientPhone}
                    onChange={(event) => updateDraft("clientPhone", event.target.value)}
                    placeholder="+41 ..."
                  />
                </DashboardField>
                <DashboardField label="Projet">
                  <DashboardInput
                    value={draft.projectName}
                    onChange={(event) => updateDraft("projectName", event.target.value)}
                    placeholder="Nom du projet"
                  />
                </DashboardField>
                <DashboardField label="Statut">
                  <DashboardSelect
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft("status", event.target.value as ProjectStatus)
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </DashboardSelect>
                </DashboardField>
                <DashboardField label="Facturé">
                  <DashboardInput
                    value={String(draft.invoicedAmount)}
                    onChange={(event) =>
                      updateDraft("invoicedAmount", Number(event.target.value) || 0)
                    }
                    type="number"
                    min="0"
                  />
                </DashboardField>
                <DashboardField label="À facturer">
                  <DashboardInput
                    value={String(draft.upcomingAmount)}
                    onChange={(event) =>
                      updateDraft("upcomingAmount", Number(event.target.value) || 0)
                    }
                    type="number"
                    min="0"
                  />
                </DashboardField>
                <DashboardField label="Date prévue">
                  <DashboardInput
                    value={draft.expectedDate}
                    onChange={(event) => updateDraft("expectedDate", event.target.value)}
                    type="date"
                  />
                </DashboardField>
                <DashboardField label="Devise">
                  <DashboardSelect
                    value={draft.currency}
                    onChange={(event) =>
                      updateDraft("currency", event.target.value as Currency)
                    }
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </DashboardSelect>
                </DashboardField>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveDraft}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={cancelDraft}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="grid gap-4 rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4 xl:grid-cols-[1fr_1fr_1.05fr_0.9fr_0.8fr_0.8fr_auto]"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                    Client
                  </p>
                  <p className="mt-2 text-sm font-medium text-neutral-950">{project.clientName}</p>
                  <p className="mt-1 text-sm text-neutral-500">{project.clientEmail}</p>
                  <p className="mt-1 text-sm text-neutral-500">{project.clientPhone}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                    Projet
                  </p>
                  <p className="mt-2 text-sm font-medium text-neutral-950">{project.projectName}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                    Statut
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[project.status]}`}
                  >
                    {project.status}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                    Facturé
                  </p>
                  <p className="mt-2 text-sm font-medium text-neutral-950">
                    {formatCurrency(project.invoicedAmount, project.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                    À facturer
                  </p>
                  <p className="mt-2 text-sm font-medium text-neutral-950">
                    {formatCurrency(project.upcomingAmount, project.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                    Date prévue
                  </p>
                  <p className="mt-2 text-sm font-medium text-neutral-950">
                    {formatDate(project.expectedDate)}
                  </p>
                </div>
                <div className="flex flex-wrap items-start justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(project)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Éditer
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProject(project.id)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <details
            className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]"
            open
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
                  Livrés
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                  Projets réalisés
                </h2>
              </div>
              <span className="mt-1 text-sm font-medium text-neutral-500 transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {completedProjects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-medium text-neutral-950">{project.projectName}</p>
                      <p className="mt-1 text-sm text-neutral-500">{project.clientName}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-neutral-950">
                    {formatCurrency(project.invoicedAmount, project.currency)}
                  </p>
                </article>
              ))}
            </div>
          </details>

          <details
            className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]"
            open
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
                  Pipeline
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                  Projets à venir
                </h2>
              </div>
              <span className="mt-1 text-sm font-medium text-neutral-500 transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {upcomingProjects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-medium text-neutral-950">{project.projectName}</p>
                      <p className="mt-1 text-sm text-neutral-500">{project.clientName}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
                    <span>{formatCurrency(project.upcomingAmount, project.currency)}</span>
                    <span>{formatDate(project.expectedDate)}</span>
                  </div>
                </article>
              ))}
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
