"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { ProjectFeedbackWorkspace } from "@/components/ProjectFeedbackWorkspace";
import type {
  ProjectFeedbackProject,
  ProjectViewerRole,
} from "@/lib/projectFeedbackTypes";
import {
  getProjectViewerRoleStorageKey,
  getProjectViewerStorageKey,
  normalizeProjectViewerRole,
} from "@/lib/projectViewerIdentity";

type ProjectFeedbackAccessProps = {
  projectId: string;
  initialUnlocked: boolean;
  initialRole: ProjectViewerRole;
  forceVisitorEntry?: boolean;
};

export function ProjectFeedbackAccess({
  projectId,
  initialUnlocked,
  initialRole,
  forceVisitorEntry = false,
}: ProjectFeedbackAccessProps) {
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
      if (typeof window !== "undefined") {
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

    setMode(nextRole);
    setAccessRole(nextRole);

    if (!savedEmail) {
      setIsLoading(false);
      return;
    }

    if (forceVisitorEntry) {
      setEmail(savedEmail);
      setIsLoading(false);
      return;
    }

    if (savedRole === "visitor") {
      setEmail(savedEmail);
      await requestAccess(savedEmail, "visitor", "", false);
      return;
    }

    if (initialUnlocked) {
      setEmail(savedEmail);
      await requestAccess(savedEmail, "team", "", false);
      return;
    }

    setEmail(savedEmail);
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
            <p className="projectFeedbackEyebrow">myStudio Review</p>
            <h1 className="projectFeedbackTitle">
              {isSubmitting ? "Opening Review" : "Loading Review"}
            </h1>
            <p className="projectFeedbackVersionMeta">
              Please wait while the project is being prepared.
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
            <p className="projectFeedbackEyebrow">myStudio Review</p>
            <h1 className="projectFeedbackTitle">Enter Your Email To Continue</h1>
            <p className="projectFeedbackVersionMeta">
              This shared review link opens in visitor mode.
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
              <span>Email</span>
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
              Open as visitor
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
          <p className="projectFeedbackEyebrow">myStudio Review</p>
          <h1 className="projectFeedbackTitle">Choose Access Type</h1>
          <p className="projectFeedbackVersionMeta">
            Team members can post edit requests and chat. Visitors can only view
            the project.
          </p>
        </div>

        <div className="projectFeedbackRoleSwitch" role="tablist" aria-label="Access type">
          <button
            className="projectFeedbackRoleButton"
            type="button"
            data-active={mode === "team" ? "true" : "false"}
            onClick={() => setMode("team")}
          >
            Team member
          </button>
          <button
            className="projectFeedbackRoleButton"
            type="button"
            data-active={mode === "visitor" ? "true" : "false"}
            onClick={() => setMode("visitor")}
          >
            Visitor
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
            <span>Email</span>
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
              <span>Password</span>
              <input
                className="projectFeedbackInput"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Use the team link to skip the password if you don't have it."
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
            {mode === "team" ? "Open as team member" : "Open as visitor"}
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
