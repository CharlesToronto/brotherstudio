"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, Pencil } from "lucide-react";

import { useTypingPlaceholder } from "@/components/useTypingPlaceholder";
import type { ProjectSummary, ProjectViewerRole } from "@/lib/projectFeedbackTypes";
import {
  getProjectViewerEntryStorageKey,
  getProjectViewerRoleStorageKey,
  getProjectViewerStorageKey,
} from "@/lib/projectViewerIdentity";

type MyProjectDirectoryProps = {
  projects: ProjectSummary[];
};

function projectStatusLabel(status: ProjectSummary["status"]) {
  return status === "approved" ? "Approved delivery" : "In review";
}

export function MyProjectDirectory({ projects }: MyProjectDirectoryProps) {
  const router = useRouter();
  const passwordPlaceholder = useTypingPlaceholder(
    "use the team link to skip the parcel number.",
  );
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [modes, setModes] = useState<Record<string, ProjectViewerRole | null>>({});
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const inReviewProjects = useMemo(
    () => projects.filter((project) => project.status === "in_review"),
    [projects],
  );
  const approvedProjects = useMemo(
    () => projects.filter((project) => project.status === "approved"),
    [projects],
  );

  const handleOpenProject = async (projectId: string) => {
    const mode = modes[projectId] ?? null;
    const email = emails[projectId]?.trim() ?? "";
    const password = passwords[projectId]?.trim() ?? "";

    if (!mode) {
      setErrorMessage("Choose Review or Visitor to continue.");
      return;
    }

    if (!email) {
      setErrorMessage("Enter your email to continue.");
      return;
    }

    if (mode === "team" && !password) {
      setErrorMessage("Enter the parcel number to continue as a team member.");
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
        window.sessionStorage.setItem(
          getProjectViewerEntryStorageKey(projectId),
          "dashboard",
        );
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

  const renderProjectCard = (project: ProjectSummary) => {
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
            <div className="projectDirectoryTitleRow">
              <h2 className="projectFeedbackVersionTitle">{project.name}</h2>
              {project.status === "approved" ? (
                <span className="projectFeedbackStatus" data-status={project.status}>
                  {projectStatusLabel(project.status)}
                </span>
              ) : (
                <span
                  className="projectFeedbackStatus projectFeedbackStatusPulse"
                  data-status={project.status}
                  aria-label={projectStatusLabel(project.status)}
                  title={projectStatusLabel(project.status)}
                />
              )}
            </div>
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
                aria-label="Review"
                title="Review"
                onClick={() => {
                  setErrorMessage("");
                  setModes((current) => ({
                    ...current,
                    [project.id]: current[project.id] === "team" ? null : "team",
                  }));
                }}
              >
                <span className="projectDirectoryRoleIcon" aria-hidden="true">
                  <Pencil size={16} strokeWidth={1.9} />
                </span>
                <span className="projectDirectoryRoleLabel">Review</span>
              </button>
              <button
                className="projectDirectoryRoleButton"
                type="button"
                data-active={mode === "visitor" ? "true" : "false"}
                aria-label="Visitor"
                title="Visitor"
                onClick={() => {
                  setErrorMessage("");
                  setModes((current) => ({
                    ...current,
                    [project.id]:
                      current[project.id] === "visitor" ? null : "visitor",
                  }));
                }}
              >
                <span className="projectDirectoryRoleIcon" aria-hidden="true">
                  <Eye size={16} strokeWidth={1.9} />
                </span>
                <span className="projectDirectoryRoleLabel">Visitor</span>
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
                    <span>Parcel Number</span>
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
                      placeholder={passwordPlaceholder}
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
                      ? "Open in review"
                      : "Open as visitor"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="projectDirectoryShell" aria-label="Current projects">
      {errorMessage ? (
        <p className="projectFeedbackMessage projectFeedbackMessageError">
          {errorMessage}
        </p>
      ) : null}

      {projects.length > 0 ? (
        <>
          <section className="projectDirectorySection">
            <div className="projectDirectorySectionHeader">
              <h2 className="projectFeedbackVersionTitle">Projects in review</h2>
              <span className="projectFeedbackVersionMeta">{inReviewProjects.length}</span>
            </div>

            {inReviewProjects.length > 0 ? (
              <div className="projectDirectoryGrid" data-layout="grid">
                {inReviewProjects.map((project) => renderProjectCard(project))}
              </div>
            ) : (
              <section className="projectFeedbackEmpty">
                <h2 className="projectFeedbackVersionTitle">No projects in review</h2>
                <p className="projectFeedbackVersionMeta">
                  Active feedback projects will appear here.
                </p>
              </section>
            )}
          </section>

          <details className="projectDirectorySection projectDirectoryDisclosure">
            <summary className="projectDirectorySectionHeader projectDirectoryDisclosureSummary">
              <h2 className="projectFeedbackVersionTitle">Approved deliveries</h2>
              <span className="projectFeedbackVersionMeta">{approvedProjects.length}</span>
            </summary>

            {approvedProjects.length > 0 ? (
              <div className="projectDirectoryGrid projectDirectoryDisclosureBody" data-layout="grid">
                {approvedProjects.map((project) => renderProjectCard(project))}
              </div>
            ) : (
              <section className="projectFeedbackEmpty projectDirectoryDisclosureBody">
                <h2 className="projectFeedbackVersionTitle">No approved deliveries</h2>
                <p className="projectFeedbackVersionMeta">
                  Approved projects move here automatically.
                </p>
              </section>
            )}
          </details>
        </>
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
