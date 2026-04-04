"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { ProjectSummary } from "@/lib/projectFeedbackTypes";

type ClientProjectsAdminProps = {
  initialProjects: ProjectSummary[];
  isConfigured: boolean;
  setupError?: string | null;
};

function formatProjectDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getProjectUrl(projectId: string, origin?: string) {
  const path = `/mystudio/${projectId}?viewer=visitor`;
  return origin ? `${origin}${path}` : path;
}

export function ClientProjectsAdmin({
  initialProjects,
  isConfigured,
  setupError,
}: ClientProjectsAdminProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [name, setName] = useState("");
  const [accessPassword, setAccessPassword] = useState("1870");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [savingNameProjectId, setSavingNameProjectId] = useState<string | null>(
    null,
  );
  const [savingPasswordProjectId, setSavingPasswordProjectId] = useState<
    string | null
  >(null);
  const [copiedProjectId, setCopiedProjectId] = useState<string | null>(null);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [isComposerOpen, setIsComposerOpen] = useState(
    initialProjects.length === 0,
  );
  const [origin, setOrigin] = useState("");
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialProjects.map((project) => [project.id, project.name])),
  );
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        initialProjects.map((project) => [
          project.id,
          project.accessPassword ?? "",
        ]),
      ),
  );
  const isLocalTlsIssue = Boolean(
    setupError?.includes("UNABLE_TO_GET_ISSUER_CERT_LOCALLY") ||
      setupError?.includes("unable to get local issuer certificate"),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);
  }, []);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [projects],
  );

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, accessPassword }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            project?: ProjectSummary;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to create project.");
      }

      setProjects((current) => [payload.project!, ...current]);
      setName("");
      setAccessPassword("1870");
      setNameDrafts((current) => ({
        ...current,
        [payload.project!.id]: payload.project!.name,
      }));
      setPasswordDrafts((current) => ({
        ...current,
        [payload.project!.id]: payload.project?.accessPassword ?? accessPassword,
      }));
      setIsComposerOpen(false);
      setStatusMessage("Project created.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create project.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleSavePassword = async (projectId: string) => {
    const nextAccessPassword = passwordDrafts[projectId]?.trim() ?? "";
    if (!nextAccessPassword) {
      setErrorMessage("Parcel number is required.");
      setStatusMessage("");
      return;
    }

    setSavingPasswordProjectId(projectId);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessPassword: nextAccessPassword }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            project?: ProjectSummary;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to update parcel number.");
      }

      const updatedProject = payload.project;

      setProjects((current) =>
        current.map((project) =>
          project.id === projectId ? updatedProject : project,
        ),
      );
      setPasswordDrafts((current) => ({
        ...current,
        [projectId]: updatedProject.accessPassword ?? nextAccessPassword,
      }));
      setStatusMessage("Parcel number updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update parcel number.",
      );
    } finally {
      setSavingPasswordProjectId(null);
    }
  };

  const handleSaveName = async (projectId: string) => {
    const nextName = nameDrafts[projectId]?.trim() ?? "";
    if (!nextName) {
      setErrorMessage("Project name is required.");
      setStatusMessage("");
      return;
    }

    setSavingNameProjectId(projectId);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            project?: ProjectSummary;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to update project name.");
      }

      const updatedProject = payload.project;

      setProjects((current) =>
        current.map((project) =>
          project.id === projectId ? updatedProject : project,
        ),
      );
      setNameDrafts((current) => ({
        ...current,
        [projectId]: updatedProject.name,
      }));
      setStatusMessage("Project name updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update project name.",
      );
    } finally {
      setSavingNameProjectId(null);
    }
  };

  const handleCopyLink = async (projectId: string) => {
    if (typeof window === "undefined") return;

    const projectUrl = getProjectUrl(projectId, window.location.origin);
    await navigator.clipboard.writeText(projectUrl);
    setCopiedProjectId(projectId);
    setStatusMessage("Project link copied.");
    setErrorMessage("");
  };

  if (!isConfigured || setupError) {
    return (
      <section className="clientAdminLayout" aria-labelledby="clientAdminTitle">
        <div className="clientAdminSection">
          <div className="clientAdminHeader">
            <h1 id="clientAdminTitle" className="clientAdminTitle">
              myStudio
            </h1>
            <p className="clientAdminText">
              {!isConfigured
                ? "Supabase is not configured in this environment."
                : isLocalTlsIssue
                  ? "Local Node cannot verify the Supabase TLS certificate."
                  : "The myStudio database setup is incomplete."}
            </p>
            <p className="clientAdminText">
              {!isConfigured ? (
                <>
                  Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                  <code>SUPABASE_SERVICE_ROLE_KEY</code> before using the project
                  review tool.
                </>
              ) : isLocalTlsIssue ? (
                <>
                  Your browser can reach Supabase, but local Next.js server
                  requests are failing TLS verification. Prefer configuring{" "}
                  <code>NODE_EXTRA_CA_CERTS</code> for your local CA. As a
                  temporary local-only fallback, you can run with{" "}
                  <code>NODE_TLS_REJECT_UNAUTHORIZED=0</code>. Production on
                  Vercel should not be affected.
                </>
              ) : (
                <>
                  Run the Supabase SQL migrations for <code>projects</code>,{" "}
                  <code>images</code>, <code>comments</code> and{" "}
                  <code>project_viewers</code>, then reload this page.
                </>
              )}
            </p>
            {setupError ? (
              <p className="clientAdminStatus clientAdminStatusError">{setupError}</p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="clientAdminLayout" aria-labelledby="clientAdminTitle">
      <div className="clientAdminSection">
        <div className="clientAdminHeader">
          <h1 id="clientAdminTitle" className="clientAdminTitle">
            myStudio Admin
          </h1>
          <p className="clientAdminText">
            Create a project, copy the client link, then open the admin project page
            to add project variants, replace images, or delete images.
          </p>
        </div>

        <div className="clientAdminToolbar">
          <div className="clientAdminToolbarGroup">
            <button
              className="clientAdminButton"
              type="button"
              onClick={() => setIsComposerOpen((current) => !current)}
            >
              {isComposerOpen ? "Masquer le formulaire" : "Nouveau projet"}
            </button>
            <p className="clientAdminText">{sortedProjects.length} project(s)</p>
          </div>

          <div className="clientAdminToolbarGroup">
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

        {isComposerOpen ? (
          <form className="clientAdminForm" onSubmit={handleCreateProject}>
            <label className="clientAdminField">
              <span className="clientAdminLabel">Project name</span>
              <input
                className="clientAdminInput"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label className="clientAdminField">
              <span className="clientAdminLabel">Parcel Number</span>
              <input
                className="clientAdminInput"
                type="text"
                value={accessPassword}
                onChange={(event) => setAccessPassword(event.target.value)}
                required
              />
            </label>

            <div className="clientAdminActions">
              <button
                className="clientAdminButton"
                type="submit"
                disabled={isCreating}
              >
                {isCreating ? "Creation..." : "Creer le projet"}
              </button>
              <button
                className="clientAdminButton clientAdminButtonGhost"
                type="button"
                onClick={() => setIsComposerOpen(false)}
              >
                Annuler
              </button>
            </div>
          </form>
        ) : null}

        {statusMessage ? <p className="clientAdminStatus">{statusMessage}</p> : null}
        {errorMessage ? (
          <p className="clientAdminStatus clientAdminStatusError">{errorMessage}</p>
        ) : null}
      </div>

      <div className="clientAdminProjects" data-layout={layout}>
        {sortedProjects.length > 0 ? (
          sortedProjects.map((project) => (
            <article
              key={project.id}
              className="clientProjectCard"
              data-layout={layout}
            >
              <div className="clientProjectCardMedia">
                {project.coverImageUrl ? (
                  <img
                    className="clientProjectCardPreview"
                    src={project.coverImageUrl}
                    alt={project.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="clientProjectCardPlaceholder">
                    <span>{project.name.slice(0, 1).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="clientProjectCardBody">
                <div className="clientProjectCardTop">
                  <div>
                    <div className="clientProjectCardTitleRow">
                      <h2 className="clientProjectCardTitle">{project.name}</h2>
                      <span
                        className="clientProjectCardStatus"
                        data-status={project.status}
                      >
                        {project.status === "approved" ? "Approved" : "In review"}
                      </span>
                    </div>
                    <p className="clientProjectCardMeta">
                      Created {formatProjectDate(project.createdAt)}
                    </p>
                    <p className="clientProjectCardMeta">
                      {project.latestVersion > 0
                        ? `Latest variant: V${project.latestVersion}`
                        : "No variants yet"}
                    </p>
                  </div>
                </div>

                <div className="clientProjectCardStats">
                  <span>{project.imageCount} image(s)</span>
                  <span>
                    {project.commentCount} edit request{project.commentCount === 1 ? "" : "s"}
                  </span>
                  <span>{project.viewerCount} viewer(s)</span>
                </div>

                <div className="clientProjectCardActions">
                  <a
                    className="clientAdminButton clientAdminButtonGhost"
                    href={`/admin/client-projects/${project.id}`}
                  >
                    Manage variants
                  </a>
                  <button
                    className="clientAdminButton clientAdminButtonGhost"
                    type="button"
                    onClick={() => void handleCopyLink(project.id)}
                  >
                    {copiedProjectId === project.id ? "Copied" : "Copy link"}
                  </button>
                </div>

                <details className="clientProjectSettingsDisclosure">
                  <summary className="clientProjectSettingsSummary">
                    Project settings
                  </summary>
                  <div className="clientProjectCardSettings">
                    <div className="clientAdminPasswordRow">
                      <label className="clientAdminField">
                        <span className="clientAdminLabel">Project name</span>
                        <input
                          className="clientAdminInput"
                          type="text"
                          value={nameDrafts[project.id] ?? ""}
                          onChange={(event) =>
                            setNameDrafts((current) => ({
                              ...current,
                              [project.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <button
                        className="clientAdminButton clientAdminButtonGhost"
                        type="button"
                        disabled={savingNameProjectId === project.id}
                        onClick={() => void handleSaveName(project.id)}
                      >
                        {savingNameProjectId === project.id
                          ? "Saving..."
                          : "Save name"}
                      </button>
                    </div>
                    <div className="clientAdminPasswordRow">
                      <label className="clientAdminField">
                        <span className="clientAdminLabel">Parcel Number</span>
                        <input
                          className="clientAdminInput"
                          type="text"
                          value={passwordDrafts[project.id] ?? ""}
                          onChange={(event) =>
                            setPasswordDrafts((current) => ({
                              ...current,
                              [project.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <button
                        className="clientAdminButton clientAdminButtonGhost"
                        type="button"
                        disabled={savingPasswordProjectId === project.id}
                        onClick={() => void handleSavePassword(project.id)}
                      >
                        {savingPasswordProjectId === project.id
                          ? "Saving..."
                          : "Save parcel number"}
                      </button>
                    </div>
                  </div>
                  <p className="clientAdminText clientAdminCode">
                    {getProjectUrl(project.id, origin)}
                  </p>
                </details>
              </div>
            </article>
          ))
        ) : (
          <div className="clientAdminSection">
            <p className="clientAdminText">No client projects yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
