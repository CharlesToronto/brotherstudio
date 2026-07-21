"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Pencil, Search, Trash2, UserPlus, X } from "lucide-react";

import { AdminLockOverlay } from "@/components/AdminLockOverlay";
import {
  DASHBOARD_PAYMENT_STATUSES,
  DASHBOARD_SERVICE_OPTIONS,
  type DashboardPaymentStatus as PaymentStatus,
  type DashboardProjectCurrency as Currency,
  type DashboardProjectRecord as Project,
  type DashboardProjectStatus as ProjectStatus,
} from "@/lib/dashboardStore";
import type { TeamClientRecord } from "@/lib/teamStore";

const DISPLAY_CURRENCY: Currency = "CAD";
const DEFAULT_CHF_TO_CAD = 1.66;

const statusOptions: ProjectStatus[] = [
  "En cours",
  "À venir",
  "Terminé",
];
const paymentStatusOptions: PaymentStatus[] = [...DASHBOARD_PAYMENT_STATUSES];
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

function createTeamClientDraftFromProject(draft: ProjectDraft | null) {
  if (!draft) return emptyTeamClientDraft;

  return {
    ...emptyTeamClientDraft,
    name: draft.clientName,
    company: draft.clientCompany,
    phone: draft.clientPhone,
    email: draft.clientEmail,
    project: draft.projectName,
  };
}

function createTeamClientDraftFromClient(client: TeamClientRecord) {
  return {
    name: client.name,
    company: client.company,
    address: client.address,
    country: client.country,
    phone: client.phone,
    email: client.email,
    project: client.project,
    status: client.status as TeamClientStatus,
    nextFollowUp: client.nextFollowUp,
  };
}

function createEmptyProject(): ProjectDraft {
  return {
    teamClientId: null,
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientPhone: "",
    clientWebsite: "",
    projectName: "",
    serviceTypes: [],
    status: "À venir",
    paymentStatus: "À facturer",
    invoicedAmount: 0,
    upcomingAmount: 0,
    expectedDate: "",
    currency: "CAD",
    exchangeRateToCad: 1,
  };
}

function buildProjectPatch(current: Project, next: ProjectDraft): Partial<ProjectDraft> {
  const patch: Partial<ProjectDraft> = {};
  const keys = Object.keys(next) as (keyof ProjectDraft)[];

  for (const key of keys) {
    const currentValue = current[key];
    const nextValue = next[key];
    const isEqual =
      Array.isArray(currentValue) && Array.isArray(nextValue)
        ? currentValue.length === nextValue.length &&
          currentValue.every((value, index) => value === nextValue[index])
        : currentValue === nextValue;

    if (!isEqual) {
      Object.assign(patch, { [key]: nextValue });
    }
  }

  return patch;
}

function buildProjectUpdatePayload(current: Project, next: ProjectDraft): Partial<ProjectDraft> {
  return {
    ...buildProjectPatch(current, next),
    status: next.status,
    paymentStatus: next.paymentStatus,
    invoicedAmount: next.invoicedAmount,
    upcomingAmount: next.upcomingAmount,
  };
}

function doesProjectMatchPatch(project: Project, patch: Partial<ProjectDraft>) {
  const keys = Object.keys(patch) as (keyof ProjectDraft)[];

  return keys.every((key) => {
    const persistedValue = project[key];
    const expectedValue = patch[key];

    if (Array.isArray(persistedValue) && Array.isArray(expectedValue)) {
      return (
        persistedValue.length === expectedValue.length &&
        persistedValue.every((value, index) => value === expectedValue[index])
      );
    }

    if (typeof persistedValue === "number" && typeof expectedValue === "number") {
      return Math.abs(persistedValue - expectedValue) < 0.01;
    }

    return persistedValue === expectedValue;
  });
}

function normalizeDraftForPaymentStatus(draft: ProjectDraft): ProjectDraft {
  const hasInvoicedAmount = Number.isFinite(draft.invoicedAmount) && draft.invoicedAmount > 0;
  const hasUpcomingAmount = Number.isFinite(draft.upcomingAmount) && draft.upcomingAmount > 0;

  if (
    (draft.paymentStatus === "Reçu" || draft.paymentStatus === "En attente de payment") &&
    !hasInvoicedAmount &&
    hasUpcomingAmount
  ) {
    return {
      ...draft,
      invoicedAmount: draft.upcomingAmount,
      upcomingAmount: 0,
    };
  }

  if (draft.paymentStatus === "À facturer" && hasInvoicedAmount && !hasUpcomingAmount) {
    return {
      ...draft,
      invoicedAmount: 0,
      upcomingAmount: draft.invoicedAmount,
    };
  }

  return draft;
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
  return project.paymentStatus === "En attente de payment" ? project.invoicedAmount : 0;
}

function getAwaitingPaymentAmount(project: Project) {
  if (project.paymentStatus !== "En attente de payment") return 0;
  return getPendingAmount(project) > 0 ? getPendingAmount(project) : project.upcomingAmount;
}

function getReceivedAmount(project: Project) {
  if (project.paymentStatus !== "Reçu") return 0;
  return project.invoicedAmount > 0 ? project.invoicedAmount : project.upcomingAmount;
}

function getNotReceivedAmount(project: Project) {
  return project.invoicedAmount + project.upcomingAmount - getReceivedAmount(project);
}

function getAmountSummary(project: Project) {
  if (project.paymentStatus === "En attente de payment") {
    return {
      label: "En attente de payment",
      amount: getAwaitingPaymentAmount(project),
      badgeClass: "bg-orange-50 text-orange-700 border border-orange-200",
      amountClass: "text-orange-700",
    };
  }

  if (project.paymentStatus === "À facturer") {
    return {
      label: "À facturer",
      amount: project.upcomingAmount > 0 ? project.upcomingAmount : getNotReceivedAmount(project),
      badgeClass: "bg-sky-50 text-sky-700 border border-sky-200",
      amountClass: "text-sky-700",
    };
  }

  return {
    label: "Reçu",
    amount: getReceivedAmount(project),
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amountClass: "text-emerald-700",
  };
}

async function fetchDashboardProjects() {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("/api/dashboard/projects", {
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });
      lastResponse = response;

      if (response.ok || response.status < 500 || attempt === 1) {
        return response;
      }
    } catch (error) {
      if (attempt === 1) throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  if (lastResponse) return lastResponse;
  throw new Error("Failed to load dashboard projects.");
}

async function loadDashboardData() {
  const [projectsResponse, clientsResponse] = await Promise.all([
    fetchDashboardProjects(),
    fetch("/api/team/clients", {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    }),
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

  return {
    projects: projectsPayload?.projects ?? [],
    clients: clientsResponse.ok ? clientsPayload?.clients ?? [] : [],
  };
}

async function loadDashboardDataWithConfirmedProject(
  projectId: string,
  expectedPatch: Partial<ProjectDraft>,
) {
  let latestData: Awaited<ReturnType<typeof loadDashboardData>> | null = null;
  let latestProject: Project | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const data = await loadDashboardData();
    const project =
      data.projects.find((entry) => String(entry.id) === String(projectId)) ?? null;

    latestData = data;
    latestProject = project;

    if (project && doesProjectMatchPatch(project, expectedPatch)) {
      return { data, project, confirmed: true };
    }

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  return {
    data: latestData ?? (await loadDashboardData()),
    project: latestProject,
    confirmed: false,
  };
}

function renderCurrencySummary(
  total: number,
  emptyLabel = "Aucun montant",
  amountClassName = "text-neutral-950",
  labelClassName = "text-neutral-400",
) {
  if (total <= 0) {
    return <p className={`text-sm ${labelClassName}`}>{emptyLabel}</p>;
  }

  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`text-xs font-semibold uppercase tracking-[0.22em] ${labelClassName}`}>
        {DISPLAY_CURRENCY}
      </span>
      <span className={`text-xl font-semibold ${amountClassName}`}>
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

const dashboardButtonMotionClass =
  "transition-[transform,background-color,color,border-color,box-shadow] duration-200 ease-out active:scale-[0.98] disabled:transform-none";
const dashboardPrimaryButtonClass = `${dashboardButtonMotionClass} hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]`;
const dashboardSecondaryButtonClass = `${dashboardButtonMotionClass} hover:-translate-y-0.5 hover:bg-neutral-50 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`;
const dashboardIconButtonClass = `${dashboardButtonMotionClass} hover:-translate-y-0.5 hover:bg-neutral-50 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`;
const dashboardDangerButtonClass = `${dashboardButtonMotionClass} hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-[0_8px_20px_rgba(244,63,94,0.16)]`;
const dashboardDisclosureButtonClass = `${dashboardButtonMotionClass} hover:-translate-y-0.5 hover:bg-neutral-950 hover:text-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.16)]`;

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
  const [editingTeamClientId, setEditingTeamClientId] = useState<string | null>(null);
  const [newClientDraft, setNewClientDraft] = useState(emptyTeamClientDraft);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    "all" | PaymentStatus
  >("all");
  const [activePaymentSlide, setActivePaymentSlide] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadProjects() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const { projects, clients } = await loadDashboardData();
        if (!isCancelled) {
          setProjects(projects);
          setTeamClients(clients);
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

  useEffect(() => {
    if (!showNewClientForm) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNewClientForm(false);
        setEditingTeamClientId(null);
        setNewClientDraft(emptyTeamClientDraft);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNewClientForm]);

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
    () => projects.filter((project) => project.status === "Terminé"),
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
  const receivedPaymentAllocation = useMemo(
    () => [
      { label: "Church", percentage: 10, amount: totalInvoiced * 0.1 },
      { label: "Taxes", percentage: 20, amount: totalInvoiced * 0.2 },
      { label: "Cashflow", percentage: 70, amount: totalInvoiced * 0.7 },
    ],
    [totalInvoiced],
  );
  const totalUpcoming = useMemo(
    () => sumInDisplayCurrency(projects, (project) => getNotReceivedAmount(project)),
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
    () => projects.filter((project) => project.paymentStatus === "En attente de payment"),
    [projects],
  );
  const inProgressProjects = useMemo(
    () => projects.filter((project) => project.status === "En cours"),
    [projects],
  );
  const totalPendingPayment = useMemo(
    () =>
      sumInDisplayCurrency(pendingPaymentProjects, (project) =>
        getAwaitingPaymentAmount(project),
      ),
    [pendingPaymentProjects],
  );
  const filteredProjects = useMemo(() => {
    const normalizedSearch = projectSearch.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        projectStatusFilter === "all" || project.status === projectStatusFilter;
      const matchesPaymentStatus =
        paymentStatusFilter === "all" ||
        project.paymentStatus === paymentStatusFilter;

      if (!matchesStatus || !matchesPaymentStatus) return false;
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
  }, [paymentStatusFilter, projectSearch, projectStatusFilter, projects]);

  const projectStats = [
    { label: "Clients", value: clientsCount },
    { label: "Projets", value: projects.length },
    { label: "En cours", value: inProgressProjects.length },
    { label: "À venir", value: upcomingOnlyProjects.length },
    { label: "Terminés", value: completedProjects.length },
  ] as const;

  const startAdd = () => {
    setErrorMessage("");
    setStatusMessage("");
    setDraft(createEmptyProject());
    setShowClientPicker(false);
    setShowServicesMenu(false);
    setShowNewClientForm(false);
    setEditingTeamClientId(null);
    setNewClientDraft(emptyTeamClientDraft);
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
      clientWebsite: project.clientWebsite,
      projectName: project.projectName,
      serviceTypes: project.serviceTypes,
      status: project.status,
      paymentStatus: project.paymentStatus,
      invoicedAmount: project.invoicedAmount,
      upcomingAmount: project.upcomingAmount,
      expectedDate: project.expectedDate,
      currency: project.currency,
      exchangeRateToCad: project.exchangeRateToCad,
    });
    setShowClientPicker(false);
    setShowServicesMenu(false);
    setShowNewClientForm(false);
    setEditingTeamClientId(null);
    setNewClientDraft(emptyTeamClientDraft);
    setEditingId(project.id);
    setIsAdding(false);
  };

  const cancelDraft = () => {
    setDraft(null);
    setShowClientPicker(false);
    setShowServicesMenu(false);
    setShowNewClientForm(false);
    setEditingTeamClientId(null);
    setNewClientDraft(emptyTeamClientDraft);
    setEditingId(null);
    setIsAdding(false);
  };

  const saveDraft = async () => {
    if (!draft) return;

    const normalizedDraft = normalizeDraftForPaymentStatus(draft);
    const normalizedProject: ProjectDraft = {
      ...normalizedDraft,
      teamClientId: normalizedDraft.teamClientId,
      clientName: normalizedDraft.clientName.trim(),
      clientCompany: normalizedDraft.clientCompany.trim(),
      clientEmail: normalizedDraft.clientEmail.trim(),
      clientPhone: normalizedDraft.clientPhone.trim(),
      clientWebsite: normalizedDraft.clientWebsite.trim(),
      projectName: normalizedDraft.projectName.trim(),
      serviceTypes: normalizedDraft.serviceTypes,
      expectedDate: normalizedDraft.expectedDate,
      invoicedAmount: Number.isFinite(normalizedDraft.invoicedAmount)
        ? normalizedDraft.invoicedAmount
        : 0,
      upcomingAmount: Number.isFinite(normalizedDraft.upcomingAmount)
        ? normalizedDraft.upcomingAmount
        : 0,
      exchangeRateToCad:
        normalizedDraft.currency === "CAD"
          ? 1
          : Number.isFinite(normalizedDraft.exchangeRateToCad) &&
              normalizedDraft.exchangeRateToCad > 0
            ? normalizedDraft.exchangeRateToCad
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
      const currentProject =
        editingId === null ? null : projects.find((project) => project.id === editingId) ?? null;
      const requestBody =
        method === "PATCH" && currentProject
          ? buildProjectUpdatePayload(currentProject, normalizedProject)
          : normalizedProject;
      const patchedFields = requestBody as Partial<ProjectDraft>;

      if (method === "PATCH" && Object.keys(patchedFields).length === 0) {
        setStatusMessage("Aucun changement à sauvegarder.");
        cancelDraft();
        return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
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

      const confirmation =
        method === "PATCH"
          ? await loadDashboardDataWithConfirmedProject(payload.project.id, patchedFields)
          : {
              data: await loadDashboardData(),
              project: payload.project,
              confirmed: true,
            };
      const persistedProject =
        confirmation.data.projects.find(
          (project) => String(project.id) === String(payload.project?.id),
        ) ?? null;

      setProjects(confirmation.data.projects);
      setTeamClients(confirmation.data.clients);

      if (!persistedProject) {
        throw new Error(
          "Le projet a répondu à la sauvegarde, mais il est introuvable après rechargement.",
        );
      }

      if (method === "PATCH" && !confirmation.confirmed) {
        throw new Error(
          "La sauvegarde n'a pas été confirmée après rechargement. Réessaie, puis vérifie la migration Supabase du dashboard si le problème revient.",
        );
      }

      setStatusMessage(isAdding ? "Projet créé." : "Projet mis à jour.");

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

      const { projects, clients } = await loadDashboardData();
      setProjects(projects);
      setTeamClients(clients);
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

  const updateDraftPaymentStatus = (paymentStatus: PaymentStatus) => {
    setDraft((current) =>
      current
        ? normalizeDraftForPaymentStatus({
            ...current,
            paymentStatus,
          })
        : current,
    );
  };

  const saveTeamClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newClientDraft.name.trim()) return;

    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const isEditingTeamClient = editingTeamClientId !== null;
      const endpoint = isEditingTeamClient
        ? `/api/team/clients/${editingTeamClientId}`
        : "/api/team/clients";
      const response = await fetch(endpoint, {
        method: isEditingTeamClient ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newClientDraft),
      });
      const payload = (await response.json().catch(() => null)) as
        | { client?: TeamClientRecord; error?: string }
        | null;

      if (!response.ok || !payload?.client) {
        throw new Error(payload?.error ?? "Failed to create team client.");
      }

      if (isEditingTeamClient) {
        const linkedProjects = projects.filter(
          (project) => project.teamClientId === payload.client!.id,
        );

        await Promise.all(
          linkedProjects.map((project) =>
            fetch(`/api/dashboard/projects/${project.id}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                teamClientId: payload.client!.id,
                clientName: payload.client!.name,
                clientCompany: payload.client!.company,
                clientEmail: payload.client!.email,
                clientPhone: payload.client!.phone,
              }),
            }).then(async (projectResponse) => {
              if (!projectResponse.ok) {
                const projectPayload = (await projectResponse.json().catch(() => null)) as
                  | { error?: string }
                  | null;
                throw new Error(
                  projectPayload?.error ?? "Failed to update linked dashboard project.",
                );
              }
            }),
          ),
        );

        const data = await loadDashboardData();
        setProjects(data.projects);
        setTeamClients(data.clients);
        setDraft((current) =>
          current?.teamClientId === payload.client!.id
            ? {
                ...current,
                clientName: payload.client!.name,
                clientCompany: payload.client!.company,
                clientEmail: payload.client!.email,
                clientPhone: payload.client!.phone,
                projectName: current.projectName || payload.client!.project,
              }
            : current,
        );
        setEditingTeamClientId(null);
        setNewClientDraft(emptyTeamClientDraft);
        setShowNewClientForm(false);
        setStatusMessage("Client mis à jour.");
        return;
      }

      const refreshedClientsResponse = await fetch("/api/team/clients", {
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });
      const refreshedClientsPayload = (await refreshedClientsResponse.json().catch(() => null)) as
        | { clients?: TeamClientRecord[]; error?: string }
        | null;

      setTeamClients((current) =>
        refreshedClientsResponse.ok && refreshedClientsPayload?.clients
          ? refreshedClientsPayload.clients
          : [payload.client!, ...current.filter((client) => client.id !== payload.client!.id)],
      );
      setDraft((current) =>
        current
          ? {
              ...current,
              teamClientId: payload.client!.id,
              clientName: payload.client!.name,
              clientCompany: payload.client!.company,
              clientEmail: payload.client!.email,
              clientPhone: payload.client!.phone,
              projectName: current.projectName || payload.client!.project,
            }
          : current,
      );
      setNewClientDraft(emptyTeamClientDraft);
      setEditingTeamClientId(null);
      setShowNewClientForm(false);
      setStatusMessage(draft ? "Contact créé et lié au projet." : "Client ajouté.");
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

  const openNewClientFormFromDraft = () => {
    setShowClientPicker(false);
    setShowServicesMenu(false);
    setEditingTeamClientId(null);
    setNewClientDraft(createTeamClientDraftFromProject(draft));
    setShowNewClientForm(true);
  };

  const openStandaloneNewClientForm = () => {
    setShowClientPicker(false);
    setShowServicesMenu(false);
    setEditingTeamClientId(null);
    setNewClientDraft(emptyTeamClientDraft);
    setShowNewClientForm(true);
  };

  const openTeamClientEditor = (client: TeamClientRecord) => {
    setShowClientPicker(false);
    setShowServicesMenu(false);
    setEditingTeamClientId(client.id);
    setNewClientDraft(createTeamClientDraftFromClient(client));
    setShowNewClientForm(true);
  };

  const deleteTeamClientFromDashboard = async (client: TeamClientRecord) => {
    const confirmed = window.confirm(
      `Supprimer le client "${client.name || "Client sans nom"}" ? Les projets liés seront conservés, mais détachés de ce client.`,
    );

    if (!confirmed) return;

    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const linkedProjects = projects.filter((project) => project.teamClientId === client.id);

      await Promise.all(
        linkedProjects.map((project) =>
          fetch(`/api/dashboard/projects/${project.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ teamClientId: null }),
          }).then(async (projectResponse) => {
            if (!projectResponse.ok) {
              const projectPayload = (await projectResponse.json().catch(() => null)) as
                | { error?: string }
                | null;
              throw new Error(
                projectPayload?.error ?? "Failed to detach linked dashboard project.",
              );
            }
          }),
        ),
      );

      const response = await fetch(`/api/team/clients/${client.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to delete team client.");
      }

      setTeamClients((current) => current.filter((entry) => entry.id !== client.id));
      setProjects((current) =>
        current.map((project) =>
          project.teamClientId === client.id ? { ...project, teamClientId: null } : project,
        ),
      );

      const data = await loadDashboardData();
      setProjects(data.projects);
      setTeamClients(data.clients);
      if (editingTeamClientId === client.id) {
        closeNewClientForm();
      }
      setStatusMessage("Client supprimé.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete team client.");
    } finally {
      setIsSaving(false);
    }
  };

  const closeNewClientForm = () => {
    setShowNewClientForm(false);
    setEditingTeamClientId(null);
    setNewClientDraft(emptyTeamClientDraft);
  };

  const renderNewClientForm = (submitLabel = "Ajouter le client") => (
    <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={saveTeamClient}>
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
      <div className="flex flex-wrap gap-3 pt-2 md:col-span-2 xl:col-span-4">
        <button
          type="submit"
          disabled={isSaving}
          className={`inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white ${dashboardPrimaryButtonClass}`}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={closeNewClientForm}
          className={`inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 ${dashboardSecondaryButtonClass}`}
        >
          Annuler
        </button>
      </div>
    </form>
  );

  const renderDraftEditor = () => {
    if (!draft) return null;

    return (
      <>
        {errorMessage ? <p className="mb-4 text-sm text-rose-700">{errorMessage}</p> : null}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                Informations
              </p>
              <button
                type="button"
                onClick={openNewClientFormFromDraft}
                disabled={isSaving}
                className={`inline-flex h-8 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 ${dashboardSecondaryButtonClass}`}
              >
                <UserPlus size={13} />
                Créer un contact
              </button>
            </div>
            <DashboardField
              label="Client"
              action={
                <button
                  type="button"
                  onClick={openClientPicker}
                  disabled={teamClients.length === 0}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 ${dashboardIconButtonClass}`}
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
            <DashboardField label="Phone number">
              <DashboardInput
                value={draft.clientPhone}
                onChange={(event) => {
                  updateDraft("teamClientId", null);
                  updateDraft("clientPhone", event.target.value);
                }}
                placeholder="+41 ..."
              />
            </DashboardField>
            <DashboardField label="Site web">
              <DashboardInput
                value={draft.clientWebsite}
                onChange={(event) => {
                  updateDraft("teamClientId", null);
                  updateDraft("clientWebsite", event.target.value);
                }}
                type="url"
                placeholder="https://..."
              />
            </DashboardField>
          </div>

          <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Projet
            </p>
            <DashboardField label="Nom du projet">
              <DashboardInput
                value={draft.projectName}
                onChange={(event) => updateDraft("projectName", event.target.value)}
                placeholder="Nom du projet"
              />
            </DashboardField>
            <DashboardField label="Date">
              <DashboardInput
                value={draft.expectedDate}
                onChange={(event) => updateDraft("expectedDate", event.target.value)}
                type="date"
              />
            </DashboardField>
            <DashboardField label="Service effectué">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowClientPicker(false);
                    setShowServicesMenu((current) => !current);
                  }}
                  className={`flex h-11 w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 text-left text-sm text-neutral-950 outline-none ${dashboardSecondaryButtonClass}`}
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
            <DashboardField label="Statuts">
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
          </div>

          <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Payment
            </p>
            <DashboardField label="Invoice">
              <DashboardInput
                value={String(draft.invoicedAmount)}
                onChange={(event) =>
                  updateDraft("invoicedAmount", Number(event.target.value) || 0)
                }
                type="number"
                min="0"
              />
            </DashboardField>
            <DashboardField label="Devis">
              <DashboardInput
                value={String(draft.upcomingAmount)}
                onChange={(event) =>
                  updateDraft("upcomingAmount", Number(event.target.value) || 0)
                }
                type="number"
                min="0"
              />
            </DashboardField>
            <DashboardField label="Statut">
              <DashboardSelect
                value={draft.paymentStatus}
                onChange={(event) =>
                  updateDraftPaymentStatus(event.target.value as PaymentStatus)
                }
              >
                {paymentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </DashboardSelect>
            </DashboardField>
            {draft.currency === "CHF" ? (
              <DashboardField label="Taux de change">
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
            ) : (
              <DashboardField label="Taux de change">
                <DashboardInput value="1.0000" disabled />
              </DashboardField>
            )}
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
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={isSaving}
            className={`inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white ${dashboardPrimaryButtonClass}`}
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={cancelDraft}
            disabled={isSaving}
            className={`inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 ${dashboardSecondaryButtonClass}`}
          >
            Annuler
          </button>
        </div>
      </>
    );
  };

  return (
    <main className="dashboardPage min-h-screen bg-black text-white">
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

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
          <article className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-neutral-400">
                  Projet
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-neutral-950">
                  Vue des statuts projet
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {projectStats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-neutral-200 bg-[#faf8f5] px-4 py-3"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                    {stat.value}
                  </p>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-neutral-400">
                Finance
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-neutral-950">
                Vue des montants
              </h2>
            </div>

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
                className="grid auto-cols-[100%] grid-flow-col gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid-flow-row lg:grid-cols-2 lg:gap-4 lg:overflow-visible"
              >
                <article className="min-w-0 snap-center rounded-2xl border border-orange-200 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.98))] p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)] lg:mr-0">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-orange-300">
                    Finance
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-orange-200">
                    En attente
                  </h2>
                  <div className="mt-6">
                    {renderCurrencySummary(
                      totalPendingPayment,
                      "Aucun montant",
                      "text-orange-200",
                      "text-orange-300/80",
                    )}
                  </div>
                </article>
                <article className="min-w-0 snap-center rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.98))] p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-sky-300">
                    Finance
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-sky-200">
                    À facturer plus tard
                  </h2>
                  <div className="mt-6">
                    {renderCurrencySummary(
                      totalUpcoming,
                      "Aucun montant",
                      "text-sky-200",
                      "text-sky-300/80",
                    )}
                  </div>
                </article>

                <article className="min-w-0 snap-center rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))] p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300">
                    Finance
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-emerald-200">
                    Payment reçu
                  </h2>
                  <div className="mt-6">
                    {renderCurrencySummary(
                      totalInvoiced,
                      "Aucun montant",
                      "text-emerald-200",
                      "text-emerald-300/80",
                    )}
                  </div>
                </article>

                <article className="min-w-0 snap-center rounded-2xl border-2 border-emerald-300 bg-[linear-gradient(135deg,rgba(220,252,231,0.96),rgba(255,255,255,0.98))] p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-lime-300">
                    Finance
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-lime-200">
                    Projection totale
                  </h2>
                  <div className="mt-6">
                    {renderCurrencySummary(
                      totalProjected,
                      "Aucun montant",
                      "text-lime-200",
                      "text-lime-300/80",
                    )}
                  </div>
                </article>
              </section>
            </div>
          </article>
        </section>

        <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-neutral-400">
              Allocation
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-neutral-950">
              Répartition du payment reçu
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {receivedPaymentAllocation.map((item) => (
              <article
                key={item.label}
                className="rounded-2xl border border-neutral-200 bg-[#faf8f5] p-6"
              >
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
                  {item.percentage}% de Payment reçu
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                  {item.label}
                </h3>
                <div className="mt-6">
                  {renderCurrencySummary(item.amount)}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboardOverviewSection bg-transparent py-0 md:rounded-2xl md:border md:border-neutral-200 md:bg-white md:p-6 md:shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4 md:items-start">
            <div className="w-full space-y-2 text-center md:w-auto md:text-left">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-sky-300">
                Vue d&apos;ensemble
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-sky-100">
                Liste des clients / projets
              </h2>
            </div>

            <button
              type="button"
              onClick={startAdd}
              disabled={isSaving}
              className={`mx-auto inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white md:mx-0 ${dashboardPrimaryButtonClass}`}
            >
              Ajouter un projet
            </button>
          </div>

          <div className="mb-5 grid gap-3 rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4 md:grid-cols-[minmax(0,1fr)_220px_240px]">
            <DashboardField label="Recherche">
              <DashboardInput
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Client, compagnie, projet, email, service..."
                type="search"
              />
            </DashboardField>
            <DashboardField label="Statut du projet">
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
            <DashboardField label="Statut du paiement">
              <DashboardSelect
                value={paymentStatusFilter}
                onChange={(event) =>
                  setPaymentStatusFilter(event.target.value as "all" | PaymentStatus)
                }
              >
                <option value="all">Tous les paiements</option>
                {paymentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </DashboardSelect>
            </DashboardField>
          </div>

          {draft && isAdding ? (
            <div className="mb-4 rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4">
              {renderDraftEditor()}
            </div>
          ) : null}

          <div className="flex snap-x snap-mandatory overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:max-h-none md:gap-0 md:overflow-visible md:px-0 md:pb-0">
            {isLoading ? (
              <p className="text-sm text-neutral-500">Chargement des projets...</p>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const amountSummary = getAmountSummary(project);
                const isEditingThisCard =
                  editingId === project.id && draft !== null && !isAdding;
                const displayAmount = formatCurrency(
                  toDisplayCurrency(
                    amountSummary.amount,
                    project.currency,
                    project.exchangeRateToCad,
                  ),
                  DISPLAY_CURRENCY,
                );

                return (
                  <article
                    key={project.id}
                    className="flex w-full flex-none snap-center justify-center px-3 p-0 sm:px-4 md:block md:w-full md:max-w-none md:border-b-2 md:border-black/15 md:px-0 md:py-4 md:last:border-b-0"
                  >
                    <details
                      className="w-full rounded-[24px] border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] group"
                      open={isEditingThisCard ? true : undefined}
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5 md:py-4">
                        <div className="min-w-0 flex-1">
                          <div className="grid gap-3 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)_minmax(0,1.05fr)_minmax(0,0.9fr)] md:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-sky-200 group-open:bg-neutral-950 group-open:text-sky-200 ${dashboardDisclosureButtonClass}`}>
                                <Eye size={15} />
                              </span>
                              <div className="min-w-0">
                                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-sky-300">
                                  Client
                                </p>
                                <p className="mt-1 truncate text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
                                  {project.clientName || "Client sans nom"}
                                </p>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-violet-300">
                                Entreprise
                              </p>
                              <p className="mt-1 truncate text-sm text-violet-100/80 sm:text-base">
                                {project.clientCompany || "Aucune entreprise"}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-pink-300">
                                Projet
                              </p>
                              <div className="mt-1 flex items-center gap-2 whitespace-nowrap">
                                <p className="min-w-0 truncate text-sm font-semibold text-pink-200 sm:text-base">
                                  {project.projectName || "Projet sans titre"}
                                </p>
                                <span className="inline-flex shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-pink-100">
                                  {project.status}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-300">
                                Finance
                              </p>
                              <div className="mt-1 flex items-center justify-start gap-2 whitespace-nowrap">
                                <p className={`shrink-0 text-base font-semibold tracking-[-0.03em] sm:text-lg ${amountSummary.amountClass}`}>
                                  {displayAmount}
                                </p>
                                <span
                                  className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${amountSummary.badgeClass}`}
                                >
                                  {amountSummary.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </summary>

                      <div className="border-t border-neutral-200/80 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                        {isEditingThisCard ? (
                          renderDraftEditor()
                        ) : (
                          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                            <div className="grid gap-3">
                              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-pink-300">
                                Projet
                              </p>
                              <div className="grid gap-2 text-sm text-sky-100/75">
                                <p className="font-semibold text-pink-200">
                                  {project.projectName || "Projet sans titre"}
                                </p>
                                <p className="text-pink-100/80">{project.status}</p>
                                <p>{formatDate(project.expectedDate)}</p>
                                <p>{project.clientEmail || "Email non renseigné"}</p>
                                <p>{project.clientPhone || "Téléphone non renseigné"}</p>
                              </div>
                            </div>

                            <div className="grid gap-3">
                              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-300">
                                Finance
                              </p>
                              <div className="flex flex-wrap items-start gap-2">
                                <span className="inline-flex rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-sky-100">
                                  {project.currency}
                                  {project.currency === "CHF"
                                    ? ` ${project.exchangeRateToCad.toFixed(2)}`
                                    : null}
                                </span>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${amountSummary.badgeClass}`}
                                >
                                  {amountSummary.label}
                                </span>
                              </div>
                              <p className={`text-lg font-semibold tracking-[-0.03em] ${amountSummary.amountClass}`}>
                                {displayAmount}
                              </p>
                              <p className="text-sm leading-6 text-sky-100/75">
                                {project.serviceTypes.length > 0
                                  ? project.serviceTypes.join(", ")
                                  : "Aucun service renseigné"}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-start gap-2 md:justify-end">
                              <button
                                type="button"
                                onClick={() => startEdit(project)}
                                disabled={isSaving}
                                aria-label="Éditer le projet"
                                title="Éditer"
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 ${dashboardIconButtonClass}`}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteProject(project.id)}
                                disabled={isSaving}
                                aria-label="Supprimer le projet"
                                title="Supprimer"
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 ${dashboardDangerButtonClass}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  </article>
                );
              })
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
                Liste des clients
              </h2>
              <p className="max-w-2xl text-sm text-neutral-600">
                Gère les informations enregistrées dans Supabase. Les projets liés sont mis à
                jour quand tu modifies un client.
              </p>
            </div>
            <button
              type="button"
              onClick={openStandaloneNewClientForm}
              disabled={isSaving}
              className={`inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 ${dashboardSecondaryButtonClass}`}
            >
              Nouveau client
            </button>
          </div>

          <div className="grid gap-3">
            {isLoading ? (
              <p className="text-sm text-neutral-500">Chargement des clients...</p>
            ) : teamClients.length > 0 ? (
              teamClients.map((client) => {
                const linkedProjects = projects.filter((project) => {
                  if (project.teamClientId === client.id) return true;
                  return (
                    !project.teamClientId &&
                    Boolean(client.email.trim()) &&
                    project.clientEmail.trim().toLowerCase() === client.email.trim().toLowerCase()
                  );
                });

                return (
                  <article
                    key={client.id}
                    className="grid gap-4 rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                        Client
                      </p>
                      <h3 className="mt-1 truncate text-lg font-semibold tracking-[-0.03em] text-neutral-950">
                        {client.name || "Client sans nom"}
                      </h3>
                      <p className="mt-1 truncate text-sm text-neutral-600">
                        {client.company || "Aucune entreprise"}
                      </p>
                    </div>

                    <div className="min-w-0 text-sm leading-6 text-neutral-600">
                      <p className="truncate">{client.email || "Email non renseigné"}</p>
                      <p className="truncate">{client.phone || "Téléphone non renseigné"}</p>
                      <p className="truncate">
                        {client.project || "Projet client non renseigné"}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                        {linkedProjects.length} projet{linkedProjects.length > 1 ? "s" : ""} lié
                        {linkedProjects.length > 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <span className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                        {client.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => openTeamClientEditor(client)}
                        disabled={isSaving}
                        aria-label="Modifier le client"
                        title="Modifier"
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 ${dashboardIconButtonClass}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteTeamClientFromDashboard(client)}
                        disabled={isSaving}
                        aria-label="Supprimer le client"
                        title="Supprimer"
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 ${dashboardDangerButtonClass}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="rounded-2xl border border-neutral-200 bg-[#faf8f5] p-4 text-sm text-neutral-500">
                Aucun client enregistré pour le moment.
              </p>
            )}
          </div>
        </section>
      </div>
      {showNewClientForm ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboardNewClientModalTitle"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeNewClientForm();
            }
          }}
        >
          <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-neutral-200 bg-white p-5 text-neutral-950 shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
                  Contact
                </p>
                <h2
                  id="dashboardNewClientModalTitle"
                  className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950"
                >
                  {editingTeamClientId ? "Modifier le client" : "Ajouter un nouveau client"}
                </h2>
                <p className="max-w-2xl text-sm text-neutral-600">
                  {editingTeamClientId
                    ? "Modifie les informations du client. Les projets liés seront synchronisés."
                    : draft
                      ? "Le contact sera créé dans Supabase, puis relié automatiquement à ce projet."
                      : "Remplis les informations du client. La donnée sera enregistrée dans Supabase."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeNewClientForm}
                disabled={isSaving}
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 ${dashboardIconButtonClass}`}
                aria-label="Fermer le popup"
              >
                <X size={18} />
              </button>
            </div>
            {renderNewClientForm(
              editingTeamClientId
                ? "Enregistrer les modifications"
                : draft
                  ? "Créer et lier le contact"
                  : "Ajouter le client",
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
