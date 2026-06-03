"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";

import { AdminLockOverlay } from "@/components/AdminLockOverlay";
import {
  DASHBOARD_SERVICE_OPTIONS,
  type DashboardProjectCurrency as Currency,
  type DashboardProjectRecord as Project,
  type DashboardProjectStatus as ProjectStatus,
} from "@/lib/dashboardStore";
import type { TeamClientRecord } from "@/lib/teamStore";

const DISPLAY_CURRENCY: Currency = "CAD";
const DEFAULT_CHF_TO_CAD = 1.66;

const statusStyles: Record<ProjectStatus, string> = {
  Réalisé: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "En cours": "bg-rose-50 text-rose-700 border border-rose-200",
  "À venir": "bg-sky-50 text-sky-700 border border-sky-200",
  "En attente": "bg-neutral-100 text-neutral-700 border border-neutral-200",
  "En attente de payment":
    "bg-orange-50 text-orange-700 border border-orange-200",
  Terminé: "bg-emerald-100 text-emerald-800 border border-emerald-300",
};

const statusOptions: ProjectStatus[] = [
  "Réalisé",
  "En cours",
  "À venir",
  "En attente",
  "En attente de payment",
  "Terminé",
];
const currencyOptions: Currency[] = ["CAD", "CHF"];
type ProjectDraft = Omit<Project, "id" | "createdAt" | "updatedAt">;
type TeamClientStatus = "new" | "contacted" | "follow_up" | "closed";

const TEAM_CLIENT_STATUSES: TeamClientStatus[] = ["new", "contacted", "follow_up", "closed"];
const emptyTeamClientDraft = {
  name: "",
  company: "",
  address: "",
  country: "",
  phone: "",
  email: "",
  project: "",
  status: "new" as TeamClientStatus,
  nextFollowUp: "",
};

function createEmptyProject(): ProjectDraft {
  return {
    teamClientId: null,
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientPhone: "",
    projectName: "",
    serviceTypes: [],
    status: "À venir",
    invoicedAmount: 0,
    upcomingAmount: 0,
    expectedDate: "",
    currency: "CAD",
    exchangeRateToCad: 1,
  };
}

function formatCurrency(amount: number, currency: Currency) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function toDisplayCurrency(amount: number, currency: Currency, exchangeRateToCad: number) {
  if (currency === "CAD") return amount;
  return amount * exchangeRateToCad;
}

function formatDate(value: string) {
  if (!value) return "Date à définir";

  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function sumInDisplayCurrency(
  items: Project[],
  selector: (project: Project) => number,
): number {
  return items.reduce((total, project) => {
    return (
      total +
      toDisplayCurrency(
        selector(project),
        project.currency,
        project.exchangeRateToCad,
      )
    );
  }, 0);
}

function getPendingAmount(project: Project) {
  return project.status === "En attente de payment" ? project.invoicedAmount : 0;
}

function getReceivedAmount(project: Project) {
  return project.status === "En attente de payment" ? 0 : project.invoicedAmount;
}

function renderCurrencySummary(total: number, emptyLabel = "Aucun montant") {
  if (total <= 0) {
    return <p className="text-sm text-neutral-400">{emptyLabel}</p>;
  }

  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
        {DISPLAY_CURRENCY}
      </span>
      <span className="text-xl font-semibold text-neutral-950">
        {formatCurrency(total, DISPLAY_CURRENCY)}
      </span>
    </div>
  );
}

function DashboardField({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <span className="flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
        <span>{label}</span>
        {action}
      </span>
      {children}
    </div>
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

const DashboardSelect = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function DashboardSelect(props, ref) {
  return (
    <select
      {...props}
      ref={ref}
      className={`h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 ${
        props.className ?? ""
      }`}
    />
  );
});

export default function DashboardPage() {
  const clientPickerRef = useRef<HTMLSelectElement | null>(null);
  const paymentCarouselRef = useRef<HTMLElement | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamClients, setTeamClients] = useState<TeamClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientDraft, setNewClientDraft] = useState(emptyTeamClientDraft);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [activePaymentSlide, setActivePaymentSlide] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadProjects() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [projectsResponse, clientsResponse] = await Promise.all([
          fetch("/api/dashboard/projects", { cache: "no-store" }),
          fetch("/api/team/clients", { cache: "no-store" }),
        ]);
        const projectsPayload = (await projectsResponse.json().catch(() => null)) as
          | { projects?: Project[]; error?: string }
          | null;
        const clientsPayload = (await clientsResponse.json().catch(() => null)) as
          | { clients?: TeamClientRecord[]; error?: string }
          | null;

        if (!projectsResponse.ok) {
          throw new Error(projectsPayload?.error ?? "Failed to load dashboard projects.");
        }
        if (!isCancelled) {
          setProjects(projectsPayload?.projects ?? []);
          setTeamClients(clientsResponse.ok ? clientsPayload?.clients ?? [] : []);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load dashboard projects.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const carousel = paymentCarouselRef.current;
    if (!carousel) return;

    let frame = 0;

    const updateActiveSlide = () => {
      const cards = Array.from(carousel.children) as HTMLElement[];
      if (cards.length === 0) return;

      const carouselRect = carousel.getBoundingClientRect();
      const carouselCenter = carouselRect.left + carouselRect.width / 2;

      let nextIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(cardCenter - carouselCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          nextIndex = index;
        }
      });

      setActivePaymentSlide((current) => (current === nextIndex ? current : nextIndex));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveSlide);
    };

    updateActiveSlide();
    carousel.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateActiveSlide);

    return () => {
      cancelAnimationFrame(frame);
      carousel.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateActiveSlide);
    };
  }, []);

  const clientsCount = useMemo(
    () =>
      new Set(
        projects
          .map((project) => project.clientEmail.trim().toLowerCase())
          .filter(Boolean),
      ).size,
    [projects],
  );

  const completedProjects = useMemo(
    () => projects.filter((project) => project.status === "Réalisé" || project.status === "Terminé"),
    [projects],
  );

  const upcomingOnlyProjects = useMemo(
    () => projects.filter((project) => project.status === "À venir"),
    [projects],
  );

  const totalInvoiced = useMemo(
    () => sumInDisplayCurrency(projects, (project) => getReceivedAmount(project)),
    [projects],
  );
  const totalUpcoming = useMemo(
    () => sumInDisplayCurrency(projects, (project) => project.upcomingAmount),
    [projects],
  );
  const totalProjected = useMemo(
    () =>
      sumInDisplayCurrency(
        projects,
        (project) => project.invoicedAmount + project.upcomingAmount,
      ),
    [projects],
  );
  const pendingPaymentProjects = useMemo(
    () => projects.filter((project) => project.status === "En attente de payment"),
    [projects],
  );
  const inProgressProjects = useMemo(
    () => projects.filter((project) => project.status === "En cours"),
    [projects],
  );
  const totalPendingPayment = useMemo(
    () => sumInDisplayCurrency(pendingPaymentProjects, (project) => getPendingAmount(project)),
    [pendingPaymentProjects],
  );
  const filteredProjects = useMemo(() => {
    const normalizedSearch = projectSearch.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        projectStatusFilter === "all" || project.status === projectStatusFilter;

      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        project.clientName,
        project.clientCompany,
        project.clientEmail,
        project.projectName,
        project.clientPhone,
        ...project.serviceTypes,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [projectSearch, projectStatusFilter, projects]);

  const stats = [
    { label: "Clients", value: clientsCount },
    { label: "Projets", value: projects.length },
    { label: "Réalisés", value: completedProjects.length },
    { label: "En cours", value: inProgressProjects.length },
    { label: "À venir", value: upcomingOnlyProjects.length },
    { label: "En attente de payment", value: pendingPaymentProjects.length },
  ] as const;

  const startAdd = () => {
    setErrorMessage("");
    setStatusMessage("");
    setDraft(createEmptyProject());
    setShowClientPicker(false);
    setShowServicesMenu(false);
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (project: Project) => {
    setErrorMessage("");
    setStatusMessage("");
    setDraft({
      teamClientId: project.teamClientId,
      clientName: project.clientName,
      clientCompany: project.clientCompany,
      clientEmail: project.clientEmail,
      clientPhone: project.clientPhone,
      projectName: project.projectName,
      serviceTypes: project.serviceTypes,
      status: project.status,
      invoicedAmount: project.invoicedAmount,
      upcomingAmount: project.upcomingAmount,
      expectedDate: project.expectedDate,
      currency: project.currency,
      exchangeRateToCad: project.exchangeRateToCad,
    });
    setShowClientPicker(false);
    setShowServicesMenu(false);
    setEditingId(project.id);
    setIsAdding(false);
  };

  const cancelDraft = () => {
    setDraft(null);
    setShowClientPicker(false);
    setShowServicesMenu(false);
    setEditingId(null);
    setIsAdding(false);
  };

  const saveDraft = async () => {
    if (!draft) return;

    const normalizedProject: ProjectDraft = {
      ...draft,
      teamClientId: draft.teamClientId,
      clientName: draft.clientName.trim(),
      clientCompany: draft.clientCompany.trim(),
      clientEmail: draft.clientEmail.trim(),
      clientPhone: draft.clientPhone.trim(),
      projectName: draft.projectName.trim(),
      serviceTypes: draft.serviceTypes,
      expectedDate: draft.expectedDate,
      invoicedAmount: Number.isFinite(draft.invoicedAmount) ? draft.invoicedAmount : 0,
      upcomingAmount: Number.isFinite(draft.upcomingAmount) ? draft.upcomingAmount : 0,
      exchangeRateToCad:
        draft.currency === "CAD"
          ? 1
          : Number.isFinite(draft.exchangeRateToCad) && draft.exchangeRateToCad > 0
            ? draft.exchangeRateToCad
            : DEFAULT_CHF_TO_CAD,
    };

    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const endpoint =
        isAdding || editingId === null
          ? "/api/dashboard/projects"
          : `/api/dashboard/projects/${editingId}`;
      const method = isAdding || editingId === null ? "POST" : "PATCH";
      const response = await fetch(endpoint, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(normalizedProject),
      });
      const payload = (await response.json().catch(() => null)) as
        | { project?: Project; teamClient?: TeamClientRecord; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(
          payload?.error ??
            (isAdding
              ? "Failed to create dashboard project."
              : "Failed to update dashboard project."),
        );
      }

      if (isAdding) {
        setProjects((current) => [payload.project!, ...current]);
        setStatusMessage("Projet créé.");
      } else if (editingId !== null) {
        setProjects((current) =>
          current.map((project) => (project.id === editingId ? payload.project! : project)),
        );
        setStatusMessage("Projet mis à jour.");
      }
      if (payload.teamClient) {
        setTeamClients((current) => {
          if (current.some((client) => client.id === payload.teamClient!.id)) {
            return current;
          }
          return [payload.teamClient!, ...current];
        });
      }

      cancelDraft();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save dashboard project.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    setErrorMessage("");
    setStatusMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/dashboard/projects/${projectId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to delete dashboard project.");
      }

      setProjects((current) => current.filter((project) => project.id !== projectId));
      if (editingId === projectId) {
        cancelDraft();
      }
      setStatusMessage("Projet supprimé.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete dashboard project.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateDraft = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const addTeamClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newClientDraft.name.trim()) return;

    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch("/api/team/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newClientDraft),
      });
      const payload = (await response.json().catch(() => null)) as
        | { client?: TeamClientRecord; error?: string }
        | null;

      if (!response.ok || !payload?.client) {
        throw new Error(payload?.error ?? "Failed to create team client.");
      }

      setTeamClients((current) => [payload.client!, ...current]);
      setNewClientDraft(emptyTeamClientDraft);
      setShowNewClientForm(false);
      setStatusMessage("Client ajouté.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create team client.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDraftCurrency = (currency: Currency) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        currency,
        exchangeRateToCad:
          currency === "CAD"
            ? 1
            : current.exchangeRateToCad > 0
              ? current.exchangeRateToCad
              : DEFAULT_CHF_TO_CAD,
      };
    });
  };

  const applyTeamClientToDraft = (clientId: string) => {
    const client = teamClients.find((entry) => entry.id === clientId);
    if (!client) return;

    setDraft((current) =>
      current
        ? {
            ...current,
            teamClientId: client.id,
            clientName: client.name,
            clientCompany: client.company,
            clientEmail: client.email,
            clientPhone: client.phone,
            projectName: current.projectName || client.project,
          }
        : current,
    );
    setShowClientPicker(false);
  };

  const toggleDraftService = (service: string) => {
    setDraft((current) => {
      if (!current) return current;
      return current.serviceTypes.includes(service)
        ? {
            ...current,
            serviceTypes: current.serviceTypes.filter((entry) => entry !== service),
          }
        : {
            ...current,
            serviceTypes: [...current.serviceTypes, service],
        };
    });
  };

  const selectedServicesLabel =
    draft?.serviceTypes.length && draft.serviceTypes.length > 0
      ? `${draft.serviceTypes.length} service${
          draft.serviceTypes.length > 1 ? "s sélectionnés" : " sélectionné"
        }`
      : "Choisir les services";
  const selectedClientLabel =
    draft?.teamClientId && teamClients.some((client) => client.id === draft.teamClientId)
      ? (() => {
          const client = teamClients.find((entry) => entry.id === draft.teamClientId);
          if (!client) return "Choisir un client existant";
          return client.company ? `${client.name} - ${client.company}` : client.name;
        })()
      : "Choisir un client existant";

  const openClientPicker = () => {
    if (teamClients.length === 0) return;
    setShowServicesMenu(false);
    setShowClientPicker(true);

    requestAnimationFrame(() => {
      const picker = clientPickerRef.current;
      if (!picker) return;
      picker.focus();
      if ("showPicker" in picker && typeof picker.showPicker === "function") {
        picker.showPicker();
      }
    });
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
          {statusMessage ? <p className="text-sm text-emerald-700">{statusMessage}</p> : null}
          {errorMessage ? <p className="text-sm text-rose-700">{errorMessage}</p> : null}
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
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

        <div className="flex items-center justify-center gap-2 pb-4 lg:hidden">
          {[
            "bg-orange-300",
            "bg-sky-300",
            "bg-emerald-300",
            "bg-emerald-400",
          ].map((dotColor, index) => (
            <span
              key={dotColor}
              className={`rounded-full transition-all duration-300 ${
                activePaymentSlide === index
                  ? `h-2.5 w-6 ${dotColor} shadow-[0_0_0_4px_rgba(255,255,255,0.7)]`
                  : `h-2 w-2 ${dotColor} opacity-45`
              }`}
            />
          ))}
        </div>
        <div className="overflow-hidden">
          <section
            ref={paymentCarouselRef}
            className="grid auto-cols-[100%] grid-flow-col gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid-flow-row lg:grid-cols-4 lg:gap-4 lg:overflow-visible"
          >
          <article className="min-w-0 snap-center rounded-2xl border border-orange-200 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.98))] p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)] lg:mr-0">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
              Payment
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
              En attente
            </h2>
            <div className="mt-6">{renderCurrencySummary(totalPendingPayment)}</div>
          </article>
          <article className="min-w-0 snap-center rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.98))] p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
              Payment
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
              À facturer plus tard
            </h2>
            <div className="mt-6">{renderCurrencySummary(totalUpcoming)}</div>
          </article>

          <article className="min-w-0 snap-center rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))] p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
              Payment
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
              Payment reçu
            </h2>
            <div className="mt-6">{renderCurrencySummary(totalInvoiced)}</div>
          </article>

          <article className="min-w-0 snap-center rounded-2xl border-2 border-emerald-300 bg-[linear-gradient(135deg,rgba(220,252,231,0.96),rgba(255,255,255,0.98))] p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
              Payment
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
              Projection totale
            </h2>
            <div className="mt-6">{renderCurrencySummary(totalProjected)}</div>
          </article>
          </section>
        </div>

        <section className="bg-transparent py-0 md:rounded-2xl md:border md:border-neutral-200 md:bg-white md:p-6 md:shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4 md:items-start">
            <div className="w-full space-y-2 text-center md:w-auto md:text-left">
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
              disabled={isSaving}
              className="mx-auto inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 md:mx-0"
            >
              Ajouter un projet
            </button>
          </div>

          <div className="mb-5 grid gap-3 rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4 md:grid-cols-[minmax(0,1.6fr)_240px]">
            <DashboardField label="Recherche">
              <DashboardInput
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Client, compagnie, projet, email, service..."
                type="search"
              />
            </DashboardField>
            <DashboardField label="Statut">
              <DashboardSelect
                value={projectStatusFilter}
                onChange={(event) =>
                  setProjectStatusFilter(event.target.value as "all" | ProjectStatus)
                }
              >
                <option value="all">Tous les statuts</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </DashboardSelect>
            </DashboardField>
          </div>

          {draft && (isAdding || editingId !== null) ? (
            <div className="mb-4 rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4">
              {errorMessage ? (
                <p className="mb-4 text-sm text-rose-700">{errorMessage}</p>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DashboardField
                  label="Client"
                  action={
                    <button
                      type="button"
                      onClick={openClientPicker}
                      disabled={teamClients.length === 0}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-50"
                      aria-label="Choisir un client existant"
                      title={
                        teamClients.length > 0
                          ? "Choisir un client existant"
                          : "Aucun client existant disponible"
                      }
                    >
                      <Search size={12} />
                    </button>
                  }
                >
                  <div className="relative">
                    <DashboardInput
                      value={draft.clientName}
                      onChange={(event) => {
                        updateDraft("teamClientId", null);
                        updateDraft("clientName", event.target.value);
                      }}
                      placeholder="Nom du client"
                    />
                    {showClientPicker && teamClients.length > 0 ? (
                      <DashboardSelect
                        ref={clientPickerRef}
                        value={draft.teamClientId ?? ""}
                        onChange={(event) => {
                          if (!event.target.value) return;
                          applyTeamClientToDraft(event.target.value);
                        }}
                        onBlur={() => setShowClientPicker(false)}
                      >
                        <option value="">{selectedClientLabel}</option>
                        {teamClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name || "Client sans nom"}
                            {client.company ? ` - ${client.company}` : ""}
                            {client.email ? ` - ${client.email}` : ""}
                          </option>
                        ))}
                      </DashboardSelect>
                    ) : null}
                  </div>
                </DashboardField>
                <DashboardField label="Compagnie">
                  <DashboardInput
                    value={draft.clientCompany}
                    onChange={(event) => {
                      updateDraft("teamClientId", null);
                      updateDraft("clientCompany", event.target.value);
                    }}
                    placeholder="Compagnie"
                  />
                </DashboardField>
                <DashboardField label="Email">
                  <DashboardInput
                    value={draft.clientEmail}
                    onChange={(event) => {
                      updateDraft("teamClientId", null);
                      updateDraft("clientEmail", event.target.value);
                    }}
                    type="email"
                    placeholder="client@email.com"
                  />
                </DashboardField>
                <DashboardField label="Téléphone">
                  <DashboardInput
                    value={draft.clientPhone}
                    onChange={(event) => {
                      updateDraft("teamClientId", null);
                      updateDraft("clientPhone", event.target.value);
                    }}
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
                <DashboardField label="Services effectués">
                  <div className="relative md:col-span-2 xl:col-span-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowClientPicker(false);
                        setShowServicesMenu((current) => !current);
                      }}
                      className="flex h-11 w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 text-left text-sm text-neutral-950 outline-none transition hover:bg-neutral-50"
                    >
                      <span className="truncate">{selectedServicesLabel}</span>
                      <span className="text-neutral-400">{showServicesMenu ? "▲" : "▼"}</span>
                    </button>
                    {showServicesMenu ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                        <div className="grid gap-2">
                          {DASHBOARD_SERVICE_OPTIONS.map((service) => (
                            <label
                              key={service}
                              className="flex items-start gap-2 text-sm text-neutral-700"
                            >
                              <input
                                type="checkbox"
                                checked={draft.serviceTypes.includes(service)}
                                onChange={() => toggleDraftService(service)}
                                className="mt-1 h-4 w-4 rounded border-neutral-300"
                              />
                              <span>{service}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
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
                <DashboardField label="Payment reçu">
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
                    onChange={(event) => updateDraftCurrency(event.target.value as Currency)}
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </DashboardSelect>
                </DashboardField>
                {draft.currency === "CHF" ? (
                  <DashboardField label="Taux CHF > CAD">
                    <DashboardInput
                      value={String(draft.exchangeRateToCad)}
                      onChange={(event) =>
                        updateDraft(
                          "exchangeRateToCad",
                          Number(event.target.value) > 0
                            ? Number(event.target.value)
                            : DEFAULT_CHF_TO_CAD,
                        )
                      }
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      placeholder="1.6600"
                    />
                  </DashboardField>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void saveDraft()}
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={cancelDraft}
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex snap-x snap-mandatory overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:max-h-none md:gap-0 md:overflow-visible md:px-0 md:pb-0">
            {isLoading ? (
              <p className="text-sm text-neutral-500">Chargement des projets...</p>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <article
                  key={project.id}
                  className="flex w-full flex-none snap-center justify-center px-3 p-0 sm:px-4 md:block md:h-full md:min-h-[20rem] md:w-full md:max-w-none md:border-b-2 md:border-black/15 md:px-0 md:py-6 md:last:border-b-0"
                >
                  <div className="w-full max-w-[40rem] rounded-[24px] border border-neutral-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                          Client
                        </p>
                        <h3 className="mt-2 text-[1.36rem] font-semibold leading-[1.02] tracking-[-0.04em] text-neutral-950">
                          {project.clientName || "Client sans nom"}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${statusStyles[project.status]}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <details className="mt-5 rounded-[22px] bg-[#f8f5f0] p-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                            Projet
                          </p>
                          <p className="mt-2 text-[1.18rem] font-semibold tracking-[-0.04em] text-neutral-950">
                            {project.projectName || "Projet sans titre"}
                          </p>
                        </div>
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500">
                          <Eye size={17} />
                        </span>
                      </summary>
                      <div className="mt-4 border-t border-neutral-200/80 pt-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[0.92rem] text-neutral-500">
                              {formatDate(project.expectedDate)}
                            </p>
                            <p className="mt-3 text-[0.92rem] text-neutral-500">
                              {project.clientCompany || "Aucune compagnie"}
                            </p>
                          </div>
                          <span className="inline-flex w-fit shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                            {project.currency}
                            {project.currency === "CHF"
                              ? ` ${project.exchangeRateToCad.toFixed(2)}`
                              : null}
                          </span>
                        </div>
                        <p className="mt-4 text-[0.94rem] leading-6 text-neutral-600">
                          {project.serviceTypes.length > 0
                            ? project.serviceTypes.join(", ")
                            : "Aucun service renseigné"}
                        </p>
                      </div>
                    </details>

                    <div className="mt-5 grid gap-3">
                      <div className="min-w-0 rounded-[18px] border border-emerald-200 bg-emerald-50/70 p-3">
                        <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                          Reçu
                        </p>
                        <p className="mt-2 text-[1.05rem] font-semibold leading-none tracking-[-0.03em] text-emerald-700">
                          {formatCurrency(
                            toDisplayCurrency(
                              getReceivedAmount(project),
                              project.currency,
                              project.exchangeRateToCad,
                            ),
                            DISPLAY_CURRENCY,
                          )}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-[18px] border border-orange-200 bg-orange-50/70 p-3">
                        <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                          Attente
                        </p>
                        <p className="mt-2 text-[1.05rem] font-semibold leading-none tracking-[-0.03em] text-orange-700">
                          {formatCurrency(
                            toDisplayCurrency(
                              getPendingAmount(project),
                              project.currency,
                              project.exchangeRateToCad,
                            ),
                            DISPLAY_CURRENCY,
                          )}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-[18px] border border-sky-200 bg-sky-50/70 p-3">
                        <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                          À facturer
                        </p>
                        <p className="mt-2 text-[1.05rem] font-semibold leading-none tracking-[-0.03em] text-sky-700">
                          {formatCurrency(
                            toDisplayCurrency(
                              project.upcomingAmount,
                              project.currency,
                              project.exchangeRateToCad,
                            ),
                            DISPLAY_CURRENCY,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2 text-[0.88rem] text-neutral-600">
                      <div>{project.clientEmail || "Email non renseigné"}</div>
                      <div>{project.clientPhone || "Téléphone non renseigné"}</div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(project)}
                        disabled={isSaving}
                        aria-label="Éditer le projet"
                        title="Éditer"
                        className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white text-[0.9rem] font-medium text-neutral-700 transition hover:bg-neutral-50"
                      >
                        Éditer
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteProject(project.id)}
                        disabled={isSaving}
                        aria-label="Supprimer le projet"
                        title="Supprimer"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="hidden md:grid md:w-full md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,0.9fr)] md:items-stretch md:gap-4">
                    <section className="flex min-w-[18rem] flex-none snap-start flex-col rounded-2xl border border-neutral-200/80 bg-white/70 p-4 xl:min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                        Information client
                      </p>
                      <div className="mt-4 flex flex-1 flex-col">
                        <div className="min-h-[4.25rem]">
                          <p className="text-lg font-semibold text-neutral-950">
                            {project.clientName || "Client sans nom"}
                          </p>
                          <p className="mt-1 text-sm text-neutral-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                            {project.clientCompany || "Aucune compagnie"}
                          </p>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-neutral-600">
                          <div className="truncate">{project.clientEmail || "Email non renseigné"}</div>
                          <div className="truncate">{project.clientPhone || "Téléphone non renseigné"}</div>
                        </div>
                      </div>
                    </section>

                    <section className="flex min-w-[18rem] flex-none snap-start flex-col rounded-2xl border border-neutral-200/80 bg-white/70 p-4 xl:min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                        Information projet
                      </p>
                      <div className="mt-4 flex flex-1 flex-col">
                        <div className="min-h-[4.25rem]">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold text-neutral-950">
                              {project.projectName || "Projet sans titre"}
                            </h3>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${statusStyles[project.status]}`}
                            >
                              {project.status}
                            </span>
                          </div>
                        </div>
                        <div className="min-h-[2.5rem] flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                          <span>{formatDate(project.expectedDate)}</span>
                          <span className="inline-flex rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                            {project.currency}
                            {project.currency === "CHF"
                              ? ` ${project.exchangeRateToCad.toFixed(2)}`
                              : null}
                          </span>
                        </div>
                        <div className="mt-4 flex-1">
                          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                            Services
                          </p>
                          <p className="mt-2 text-sm leading-6 text-neutral-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                            {project.serviceTypes.length > 0
                              ? project.serviceTypes.join(", ")
                              : "Aucun service renseigné"}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="flex min-w-[18rem] flex-none snap-start flex-col rounded-2xl border border-neutral-200/80 bg-white/70 p-4 xl:min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                        Finance
                      </p>
                      <div className="mt-4 flex flex-1 flex-col justify-between">
                        <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-white/85 p-4">
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                              Payment reçu
                            </span>
                            <strong className="text-[1.05rem] font-semibold text-emerald-700">
                              {formatCurrency(
                                toDisplayCurrency(
                                  getReceivedAmount(project),
                                  project.currency,
                                  project.exchangeRateToCad,
                                ),
                                DISPLAY_CURRENCY,
                              )}
                            </strong>
                          </div>
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                              En attente
                            </span>
                            <strong className="text-[1.05rem] font-semibold text-orange-700">
                              {formatCurrency(
                                toDisplayCurrency(
                                  getPendingAmount(project),
                                  project.currency,
                                  project.exchangeRateToCad,
                                ),
                                DISPLAY_CURRENCY,
                              )}
                            </strong>
                          </div>
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                              À facturer
                            </span>
                            <strong className="text-[1.05rem] font-semibold text-sky-700">
                              {formatCurrency(
                                toDisplayCurrency(
                                  project.upcomingAmount,
                                  project.currency,
                                  project.exchangeRateToCad,
                                ),
                                DISPLAY_CURRENCY,
                              )}
                            </strong>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(project)}
                            disabled={isSaving}
                            aria-label="Éditer le projet"
                            title="Éditer"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteProject(project.id)}
                            disabled={isSaving}
                            aria-label="Supprimer le projet"
                            title="Supprimer"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-neutral-500">
                {projects.length > 0
                  ? "Aucun projet ne correspond aux filtres."
                  : "Aucun projet pour le moment."}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
                Clients
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                Ajouter un nouveau client
              </h2>
              <p className="max-w-2xl text-sm text-neutral-600">
                Crée un client dans le même système que la page team.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewClientForm((current) => !current)}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              {showNewClientForm ? "Fermer" : "Nouveau client"}
            </button>
          </div>

          {showNewClientForm ? (
            <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={addTeamClient}>
              <DashboardField label="Nom du client">
                <DashboardInput
                  value={newClientDraft.name}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Nom du client"
                  required
                />
              </DashboardField>
              <DashboardField label="Entreprise">
                <DashboardInput
                  value={newClientDraft.company}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, company: event.target.value }))
                  }
                  placeholder="Entreprise"
                />
              </DashboardField>
              <DashboardField label="Adresse">
                <DashboardInput
                  value={newClientDraft.address}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, address: event.target.value }))
                  }
                  placeholder="Adresse"
                />
              </DashboardField>
              <DashboardField label="Pays">
                <DashboardInput
                  value={newClientDraft.country}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, country: event.target.value }))
                  }
                  placeholder="Pays"
                />
              </DashboardField>
              <DashboardField label="Téléphone">
                <DashboardInput
                  value={newClientDraft.phone}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="+41 ..."
                />
              </DashboardField>
              <DashboardField label="Email">
                <DashboardInput
                  value={newClientDraft.email}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, email: event.target.value }))
                  }
                  type="email"
                  placeholder="client@email.com"
                />
              </DashboardField>
              <DashboardField label="Projet">
                <DashboardInput
                  value={newClientDraft.project}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({ ...current, project: event.target.value }))
                  }
                  placeholder="Projet"
                />
              </DashboardField>
              <DashboardField label="Statut">
                <DashboardSelect
                  value={newClientDraft.status}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({
                      ...current,
                      status: event.target.value as TeamClientStatus,
                    }))
                  }
                >
                  {TEAM_CLIENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </DashboardSelect>
              </DashboardField>
              <DashboardField label="Prochain suivi">
                <DashboardInput
                  value={newClientDraft.nextFollowUp}
                  onChange={(event) =>
                    setNewClientDraft((current) => ({
                      ...current,
                      nextFollowUp: event.target.value,
                    }))
                  }
                  type="date"
                />
              </DashboardField>
              <div className="md:col-span-2 xl:col-span-4 flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Ajouter le client
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setShowNewClientForm(false);
                    setNewClientDraft(emptyTeamClientDraft);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  );
}
