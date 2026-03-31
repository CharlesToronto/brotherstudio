"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { ProjectFeedbackWorkspace } from "@/components/ProjectFeedbackWorkspace";
import type { ProjectFeedbackProject } from "@/lib/projectFeedbackTypes";

type ProjectFeedbackAccessProps = {
  projectId: string;
  initialUnlocked: boolean;
};

const projectAccessStorageKey = (projectId: string) =>
  `bs_project_access_email:${projectId}`;

export function ProjectFeedbackAccess({
  projectId,
  initialUnlocked,
}: ProjectFeedbackAccessProps) {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [project, setProject] = useState<ProjectFeedbackProject | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked);
  const [isLoading, setIsLoading] = useState(initialUnlocked);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const requestUnlock = async (submittedPassword: string) => {
    setIsUnlocking(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/project/${projectId}/unlock`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: submittedPassword }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to unlock project.");
      }

      setIsUnlocked(true);
      setPassword("");

      if (typeof window !== "undefined") {
        const savedEmail =
          window.localStorage.getItem(projectAccessStorageKey(projectId)) ?? "";

        if (savedEmail) {
          setEmail(savedEmail);
          await requestAccess(savedEmail, false);
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to unlock project.",
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  const requestAccess = async (submittedEmail: string, persist = true) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/project/${projectId}/viewer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: submittedEmail }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to open project.");
      }

      setProject(payload.project);
      setEmail(submittedEmail);

      if (persist && typeof window !== "undefined") {
        window.localStorage.setItem(
          projectAccessStorageKey(projectId),
          submittedEmail,
        );
      }
    } catch (error) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(projectAccessStorageKey(projectId));
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
      window.localStorage.getItem(projectAccessStorageKey(projectId)) ?? "";

    setIsUnlocked(initialUnlocked);

    if (!initialUnlocked || !savedEmail) {
      setIsLoading(false);
      return;
    }

    setEmail(savedEmail);
    await requestAccess(savedEmail, false);
  });

  useEffect(() => {
    setProject(null);
    setPassword("");
    setErrorMessage("");
    void restoreSavedAccess();
  }, [projectId, initialUnlocked]);

  if (project) {
    return <ProjectFeedbackWorkspace initialProject={project} />;
  }

  if (isLoading || isSubmitting || isUnlocking) {
    return (
      <section className="projectFeedbackShell">
        <div className="projectFeedbackHeader projectFeedbackLoadingState">
          <span className="projectFeedbackSpinner" aria-hidden="true" />
          <div className="projectFeedbackIntro">
            <p className="projectFeedbackEyebrow">myStudio Review</p>
            <h1 className="projectFeedbackTitle">
              {isUnlocking
                ? "Unlocking Review"
                : isSubmitting
                  ? "Opening Review"
                  : "Loading Review"}
            </h1>
            <p className="projectFeedbackVersionMeta">
              Please wait while the project is being prepared.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!isUnlocked) {
    return (
      <section className="projectFeedbackShell">
        <div className="projectFeedbackHeader">
          <div className="projectFeedbackIntro">
            <p className="projectFeedbackEyebrow">myStudio Review</p>
            <h1 className="projectFeedbackTitle">Enter Project Password</h1>
            <p className="projectFeedbackVersionMeta">
              This review space is protected. Enter the project password to continue.
            </p>
          </div>

          <form
            className="projectFeedbackAccessForm"
            onSubmit={(event) => {
              event.preventDefault();
              void requestUnlock(password);
            }}
          >
            <label className="projectFeedbackField">
              <span>Password</span>
              <input
                className="projectFeedbackInput"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <button className="projectFeedbackAction" type="submit">
              Open protected project
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
          <h1 className="projectFeedbackTitle">Enter Your Email To Continue</h1>
          <p className="projectFeedbackVersionMeta">
            Every reviewer must submit an email before accessing this review
            space.
          </p>
        </div>

        <form
          className="projectFeedbackAccessForm"
          onSubmit={(event) => {
            event.preventDefault();
            void requestAccess(email);
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
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? "Opening..." : "Open review"}
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
