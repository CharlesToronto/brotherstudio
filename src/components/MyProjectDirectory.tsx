"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ProjectSummary, ProjectViewerRole } from "@/lib/projectFeedbackTypes";
import {
  getProjectViewerRoleStorageKey,
  getProjectViewerStorageKey,
} from "@/lib/projectViewerIdentity";

type MyProjectDirectoryProps = {
  projects: ProjectSummary[];
};

export function MyProjectDirectory({ projects }: MyProjectDirectoryProps) {
  const router = useRouter();
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [modes, setModes] = useState<Record<string, ProjectViewerRole | null>>({});
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleOpenProject = async (projectId: string) => {
    const mode = modes[projectId] ?? null;
    const email = emails[projectId]?.trim() ?? "";
    const password = passwords[projectId]?.trim() ?? "";

    if (!mode) {
      setErrorMessage("Choose Team member or Visitor to continue.");
      return;
    }

    if (!email) {
      setErrorMessage("Enter your email to continue.");
      return;
    }

    if (mode === "team" && !password) {
      setErrorMessage("Enter the project password to continue as a team member.");
      return;
    }

    setBusyProjectId(projectId);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/project/${projectId}/viewer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          role: mode,
          password: mode === "team" ? password : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: unknown; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to open project.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(getProjectViewerStorageKey(projectId), email);
        window.localStorage.setItem(getProjectViewerRoleStorageKey(projectId), mode);
      }

      router.push(`/mystudio/${projectId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to open project.",
      );
    } finally {
      setBusyProjectId(null);
    }
  };

  return (
    <section className="projectDirectoryShell" aria-label="Current projects">
      <section className="projectFeedbackHeader myStudioGuide" aria-labelledby="myStudioGuideTitle">
        <div className="projectFeedbackIntro">
          <h2
            id="myStudioGuideTitle"
            className="projectFeedbackTitle myStudioGuideHeading"
          >
            Welcome on <span className="myStudioGuideWord">myStudio</span>
          </h2>
          <p className="projectFeedbackVersionMeta">
            myStudio keeps every project variant in one place. Team members can
            leave edit requests directly on the image and use team chat, while
            visitors can simply review the latest delivery.
          </p>
        </div>

        <div className="myStudioGuideSteps" aria-label="myStudio workflow">
          <article className="myStudioGuideStep">
            <div className="myStudioGuideVisual" data-visual="project" aria-hidden="true">
              <svg viewBox="0 0 120 84" role="presentation">
                <rect x="10" y="14" width="100" height="56" rx="6" />
                <rect x="18" y="22" width="48" height="40" rx="4" />
                <path d="M24 52l12-12 10 10 12-16 10 12" />
                <path d="M74 28h24" />
                <path d="M74 40h20" />
                <path d="M74 52h16" />
              </svg>
            </div>

            <div className="myStudioGuideStepCopy">
              <p className="myStudioGuideStepIndex">01</p>
              <h3 className="myStudioGuideStepTitle">Open your project</h3>
              <p className="myStudioGuideStepMeta">
                Team access or visitor view
              </p>
            </div>
          </article>

          <div className="myStudioGuideArrow" aria-hidden="true">
            <svg viewBox="0 0 64 20" role="presentation">
              <path d="M2 10h54" />
              <path d="M46 3l14 7-14 7" />
            </svg>
          </div>

          <article className="myStudioGuideStep">
            <div className="myStudioGuideVisual" data-visual="review" aria-hidden="true">
              <svg viewBox="0 0 120 84" role="presentation">
                <path d="M28 20h64a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H58l-16 12v-12H28a8 8 0 0 1-8-8V28a8 8 0 0 1 8-8Z" />
                <circle cx="42" cy="40" r="6" />
                <path d="M58 36h24" />
                <path d="M58 46h18" />
                <path d="M32 14l6 6" />
                <path d="M38 8l2 12" />
              </svg>
            </div>

            <div className="myStudioGuideStepCopy">
              <p className="myStudioGuideStepIndex">02</p>
              <h3 className="myStudioGuideStepTitle">Review and discuss</h3>
              <p className="myStudioGuideStepMeta">
                Edit requests and team chat
              </p>
            </div>
          </article>

          <div className="myStudioGuideArrow" aria-hidden="true">
            <svg viewBox="0 0 64 20" role="presentation">
              <path d="M2 10h54" />
              <path d="M46 3l14 7-14 7" />
            </svg>
          </div>

          <article className="myStudioGuideStep">
            <div className="myStudioGuideVisual" data-visual="approval" aria-hidden="true">
              <svg viewBox="0 0 120 84" role="presentation">
                <path d="M34 28h52a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6V34a6 6 0 0 1 6-6Z" />
                <path d="M48 48l8 8 18-20" />
                <path d="M60 10v28" />
                <path d="M50 28l10 10 10-10" />
              </svg>
            </div>

            <div className="myStudioGuideStepCopy">
              <p className="myStudioGuideStepIndex">03</p>
              <h3 className="myStudioGuideStepTitle">Approve and deliver</h3>
              <p className="myStudioGuideStepMeta">
                Final files stay in the project
              </p>
            </div>
          </article>
        </div>
      </section>

      {errorMessage ? (
        <p className="projectFeedbackMessage projectFeedbackMessageError">
          {errorMessage}
        </p>
      ) : null}

      {projects.length > 0 ? (
        <div className="projectDirectoryGrid" data-layout="grid">
          {projects.map((project) => {
            const mode = modes[project.id] ?? null;

            return (
              <article
                key={project.id}
                className="projectDirectoryCard"
                data-layout="grid"
              >
                <div className="projectDirectoryMedia">
                  {project.coverImageUrl ? (
                    <img
                      className="projectDirectoryImage"
                      src={project.coverImageUrl}
                      alt={project.name}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="projectDirectoryPlaceholder">
                      <span>{project.name.slice(0, 1).toUpperCase()}</span>
                    </div>
                  )}
                </div>

                <div className="projectDirectoryBody">
                  <div className="projectDirectoryHeader">
                    <h2 className="projectFeedbackVersionTitle">{project.name}</h2>
                    <p className="projectFeedbackVersionMeta">
                      {project.latestVersion > 0
                        ? `Latest variant: V${project.latestVersion}`
                        : "No variants yet"}
                    </p>
                  </div>

                  <div className="projectFeedbackSummary">
                    <span>{project.imageCount} image(s)</span>
                    <span>
                      {project.commentCount} edit request{project.commentCount === 1 ? "" : "s"}
                    </span>
                    <span>{project.viewerCount} viewer(s)</span>
                  </div>

                  <div className="projectDirectoryAccess">
                    <div className="projectDirectoryRoleSwitch">
                      <button
                        className="projectDirectoryRoleButton"
                        type="button"
                        data-active={mode === "team" ? "true" : "false"}
                        onClick={() => {
                          setErrorMessage("");
                          setModes((current) => ({
                            ...current,
                            [project.id]: current[project.id] === "team" ? null : "team",
                          }));
                        }}
                      >
                        Team member
                      </button>
                      <button
                        className="projectDirectoryRoleButton"
                        type="button"
                        data-active={mode === "visitor" ? "true" : "false"}
                        onClick={() => {
                          setErrorMessage("");
                          setModes((current) => ({
                            ...current,
                            [project.id]:
                              current[project.id] === "visitor" ? null : "visitor",
                          }));
                        }}
                      >
                        Visitor
                      </button>
                    </div>

                    {mode ? (
                      <div className="projectDirectoryAccessPanel">
                        <label className="projectFeedbackField">
                          <span>Email</span>
                          <input
                            className="projectFeedbackInput"
                            type="email"
                            value={emails[project.id] ?? ""}
                            onChange={(event) =>
                              setEmails((current) => ({
                                ...current,
                                [project.id]: event.target.value,
                              }))
                            }
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
                              value={passwords[project.id] ?? ""}
                              onChange={(event) =>
                                setPasswords((current) => ({
                                  ...current,
                                  [project.id]: event.target.value,
                                }))
                              }
                              placeholder="Use the team link to skip the password if you don't have it."
                              autoComplete="current-password"
                              required
                            />
                          </label>
                        ) : null}

                        <button
                          className="projectFeedbackAction"
                          type="button"
                          disabled={busyProjectId === project.id}
                          onClick={() => void handleOpenProject(project.id)}
                        >
                          {busyProjectId === project.id
                            ? "Opening..."
                            : mode === "team"
                              ? "Open as team member"
                              : "Open as visitor"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="projectFeedbackEmpty">
          <h2 className="projectFeedbackVersionTitle">No current projects</h2>
          <p className="projectFeedbackVersionMeta">
            No in-review projects are available right now.
          </p>
        </section>
      )}
    </section>
  );
}
