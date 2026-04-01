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
  const [layout, setLayout] = useState<"grid" | "list">("grid");

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

      router.push(`/myproject/${projectId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to open project.",
      );
    } finally {
      setBusyProjectId(null);
    }
  };

  return (
    <section className="projectDirectoryShell" aria-labelledby="projectDirectoryTitle">
      <header className="projectFeedbackHeader">
        <div className="projectFeedbackIntro">
          <p className="projectFeedbackEyebrow">myStudio</p>
          <h1 id="projectDirectoryTitle" className="projectFeedbackTitle">
            Current Projects
          </h1>
          <p className="projectFeedbackVersionMeta">
            Open a project as a team member to collaborate, or as a visitor for
            view-only access.
          </p>
        </div>

        {errorMessage ? (
          <p className="projectFeedbackMessage projectFeedbackMessageError">
            {errorMessage}
          </p>
        ) : null}

        <div className="projectDirectoryToolbar">
          <div className="projectDirectoryToolbarGroup">
            <p className="projectFeedbackVersionMeta">{projects.length} project(s)</p>
          </div>

          <div className="projectDirectoryToolbarGroup">
            <button
              className="clientAdminButton clientAdminButtonGhost"
              type="button"
              data-active={layout === "grid" ? "true" : "false"}
              onClick={() => setLayout("grid")}
            >
              Grille
            </button>
            <button
              className="clientAdminButton clientAdminButtonGhost"
              type="button"
              data-active={layout === "list" ? "true" : "false"}
              onClick={() => setLayout("list")}
            >
              Liste
            </button>
          </div>
        </div>
      </header>

      {projects.length > 0 ? (
        <div className="projectDirectoryGrid" data-layout={layout}>
          {projects.map((project) => {
            const mode = modes[project.id] ?? null;

            return (
              <article
                key={project.id}
                className="projectDirectoryCard"
                data-layout={layout}
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
