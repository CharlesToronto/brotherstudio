"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ProjectSummary } from "@/lib/projectFeedbackTypes";

type MyProjectDirectoryProps = {
  projects: ProjectSummary[];
};

export function MyProjectDirectory({ projects }: MyProjectDirectoryProps) {
  const router = useRouter();
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const handleOpenProject = async (projectId: string) => {
    const password = passwords[projectId]?.trim() ?? "";
    if (!password) {
      setErrorMessage("Enter the project password to continue.");
      return;
    }

    setBusyProjectId(projectId);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/project/${projectId}/unlock`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to unlock project.");
      }

      router.push(`/myproject/${projectId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to unlock project.",
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
            Enter the password for a project to open its private review space.
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
          {projects.map((project) => (
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
                      ? `Upload ${project.latestVersion}`
                      : "No images yet"}
                  </p>
                </div>

                <div className="projectFeedbackSummary">
                  <span>{project.imageCount} image(s)</span>
                  <span>{project.commentCount} comment(s)</span>
                  <span>{project.viewerCount} viewer(s)</span>
                </div>

                <div className="projectDirectoryAccess">
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
                      autoComplete="current-password"
                      required
                    />
                  </label>

                  <button
                    className="projectFeedbackAction"
                    type="button"
                    disabled={busyProjectId === project.id}
                    onClick={() => void handleOpenProject(project.id)}
                  >
                    {busyProjectId === project.id ? "Opening..." : "Open project"}
                  </button>
                </div>
              </div>
            </article>
          ))}
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
