"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { ProjectFeedbackWorkspace } from "@/components/ProjectFeedbackWorkspace";
import { useTypingPlaceholder } from "@/components/useTypingPlaceholder";
import type {
  ProjectFeedbackProject,
  ProjectViewerRole,
} from "@/lib/projectFeedbackTypes";
import type { AssistantLocale } from "@/lib/siteAssistantKnowledge";
import {
  getProjectViewerEntryStorageKey,
  getProjectViewerRoleStorageKey,
  getProjectViewerStorageKey,
  normalizeProjectViewerRole,
} from "@/lib/projectViewerIdentity";

type ProjectFeedbackAccessProps = {
  projectId: string;
  initialUnlocked: boolean;
  initialRole: ProjectViewerRole;
  forceVisitorEntry?: boolean;
  locale: AssistantLocale;
};

function buildCopy(locale: AssistantLocale) {
  return locale === "fr"
    ? {
        passwordPlaceholder: "utilisez le lien équipe pour éviter le numéro de parcelle.",
        loadingTitle: "Chargement de la review",
        openingTitle: "Ouverture de la review",
        loadingMessage: "Veuillez patienter pendant la préparation du projet.",
        visitorTitle: "Entrez votre email pour continuer",
        visitorMessage: "Ce lien partagé ouvre le projet en mode visiteur.",
        accessTitle: "Choisissez le type d’accès",
        accessMessage:
          "Les membres de l’équipe peuvent ajouter des demandes de modification. Les visiteurs peuvent uniquement consulter le projet.",
        email: "Email",
        parcelNumber: "Numéro de parcelle",
        teamMember: "Membre de l’équipe",
        visitor: "Visiteur",
        openVisitor: "Ouvrir en mode visiteur",
        openTeam: "Ouvrir en mode équipe",
      }
    : {
        passwordPlaceholder: "use the team link to skip the parcel number.",
        loadingTitle: "Loading Review",
        openingTitle: "Opening Review",
        loadingMessage: "Please wait while the project is being prepared.",
        visitorTitle: "Enter Your Email To Continue",
        visitorMessage: "This shared review link opens in visitor mode.",
        accessTitle: "Choose Access Type",
        accessMessage:
          "Team members can post edit requests. Visitors can only view the project.",
        email: "Email",
        parcelNumber: "Parcel Number",
        teamMember: "Team member",
        visitor: "Visitor",
        openVisitor: "Open as visitor",
        openTeam: "Open as team member",
      };
}

export function ProjectFeedbackAccess({
  projectId,
  initialUnlocked,
  initialRole,
  forceVisitorEntry = false,
  locale,
}: ProjectFeedbackAccessProps) {
  const copy = buildCopy(locale);
  const passwordPlaceholder = useTypingPlaceholder(copy.passwordPlaceholder);
  const [mode, setMode] = useState<ProjectViewerRole>(
    forceVisitorEntry ? "visitor" : initialRole,
  );
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [project, setProject] = useState<ProjectFeedbackProject | null>(null);
  const [accessRole, setAccessRole] = useState<ProjectViewerRole>(
    forceVisitorEntry ? "visitor" : initialRole,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const requestAccess = async (
    submittedEmail: string,
    submittedRole: ProjectViewerRole,
    submittedPassword = "",
    persist = true,
  ) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/project/${projectId}/viewer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: submittedEmail,
          role: submittedRole,
          password: submittedRole === "team" ? submittedPassword : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to open project.");
      }

      setProject(payload.project);
      setEmail(submittedEmail);
      setPassword("");
      setAccessRole(submittedRole);
      setMode(submittedRole);

      if (persist && typeof window !== "undefined") {
        window.localStorage.setItem(
          getProjectViewerStorageKey(projectId),
          submittedEmail,
        );
        window.localStorage.setItem(
          getProjectViewerRoleStorageKey(projectId),
          submittedRole,
        );
      }
    } catch (error) {
      if (persist && typeof window !== "undefined") {
        window.localStorage.removeItem(getProjectViewerStorageKey(projectId));
        window.localStorage.removeItem(getProjectViewerRoleStorageKey(projectId));
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Failed to open project.",
      );
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const restoreSavedAccess = useEffectEvent(async () => {
    if (typeof window === "undefined") return;

    const savedEmail =
      window.localStorage.getItem(getProjectViewerStorageKey(projectId)) ?? "";
    const savedRole = normalizeProjectViewerRole(
      window.localStorage.getItem(getProjectViewerRoleStorageKey(projectId)) ??
        initialRole,
    );
    const nextRole = forceVisitorEntry ? "visitor" : savedRole;
    const entrySource =
      window.sessionStorage.getItem(getProjectViewerEntryStorageKey(projectId)) ?? "";

    window.sessionStorage.removeItem(getProjectViewerEntryStorageKey(projectId));

    setMode(nextRole);
    setAccessRole(nextRole);
    setEmail(savedEmail);

    const canRestoreProjectAccess =
      !forceVisitorEntry &&
      savedEmail &&
      (entrySource === "dashboard" ||
        initialUnlocked ||
        nextRole === "visitor");

    if (canRestoreProjectAccess) {
      setIsLoading(true);
      await requestAccess(savedEmail, nextRole, "", false);
      return;
    }

    setIsLoading(false);
  });

  useEffect(() => {
    setProject(null);
    setPassword("");
    setErrorMessage("");
    void restoreSavedAccess();
  }, [projectId, initialUnlocked, initialRole, forceVisitorEntry]);

  if (project) {
    return (
      <ProjectFeedbackWorkspace
        initialProject={project}
        canInteract={accessRole === "team"}
        viewerRole={accessRole}
      />
    );
  }

  if (isLoading || isSubmitting) {
    return (
      <section className="projectFeedbackShell">
        <div className="projectFeedbackHeader projectFeedbackLoadingState">
          <span className="projectFeedbackSpinner" aria-hidden="true" />
          <div className="projectFeedbackIntro">
            <p className="projectFeedbackEyebrow">MyReview™</p>
            <h1 className="projectFeedbackTitle">
              {isSubmitting ? copy.openingTitle : copy.loadingTitle}
            </h1>
            <p className="projectFeedbackVersionMeta">
              {copy.loadingMessage}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (forceVisitorEntry) {
    return (
      <section className="projectFeedbackShell">
        <div className="projectFeedbackHeader">
          <div className="projectFeedbackIntro">
            <p className="projectFeedbackEyebrow">MyReview™</p>
            <h1 className="projectFeedbackTitle">{copy.visitorTitle}</h1>
            <p className="projectFeedbackVersionMeta">
              {copy.visitorMessage}
            </p>
          </div>

          <form
            className="projectFeedbackAccessForm"
            onSubmit={(event) => {
              event.preventDefault();
              void requestAccess(email, "visitor", "");
            }}
          >
            <label className="projectFeedbackField">
              <span>{copy.email}</span>
              <input
                className="projectFeedbackInput"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                required
              />
            </label>

            <button
              className="projectFeedbackAction"
              type="submit"
              disabled={isSubmitting}
            >
              {copy.openVisitor}
            </button>

            {errorMessage ? (
              <p className="projectFeedbackMessage projectFeedbackMessageError">
                {errorMessage}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="projectFeedbackShell">
      <div className="projectFeedbackHeader">
        <div className="projectFeedbackIntro">
          <p className="projectFeedbackEyebrow">MyReview™</p>
          <h1 className="projectFeedbackTitle">{copy.accessTitle}</h1>
          <p className="projectFeedbackVersionMeta">
            {copy.accessMessage}
          </p>
        </div>

        <div className="projectFeedbackRoleSwitch" role="tablist" aria-label="Access type">
            <button
            className="projectFeedbackRoleButton"
            type="button"
            data-active={mode === "team" ? "true" : "false"}
            onClick={() => setMode("team")}
          >
            {copy.teamMember}
          </button>
          <button
            className="projectFeedbackRoleButton"
            type="button"
            data-active={mode === "visitor" ? "true" : "false"}
            onClick={() => setMode("visitor")}
          >
            {copy.visitor}
          </button>
        </div>

        <form
          className="projectFeedbackAccessForm"
          onSubmit={(event) => {
            event.preventDefault();
            void requestAccess(email, mode, password);
          }}
        >
          <label className="projectFeedbackField">
            <span>{copy.email}</span>
            <input
              className="projectFeedbackInput"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
          </label>

          {mode === "team" ? (
            <label className="projectFeedbackField">
              <span>{copy.parcelNumber}</span>
              <input
                className="projectFeedbackInput"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={passwordPlaceholder}
                autoComplete="current-password"
                required
              />
            </label>
          ) : null}

          <button
            className="projectFeedbackAction"
            type="submit"
            disabled={isSubmitting}
          >
            {mode === "team" ? copy.openTeam : copy.openVisitor}
          </button>

          {errorMessage ? (
            <p className="projectFeedbackMessage projectFeedbackMessageError">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
