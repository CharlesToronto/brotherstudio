"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  ChangeEvent,
  Dispatch,
  MouseEvent,
  SetStateAction,
} from "react";

import type {
  ProjectFeedbackComment,
  ProjectFeedbackProject,
  ProjectFeedbackImage,
  ProjectFeedbackTeamMessage,
  ProjectViewerRole,
} from "@/lib/projectFeedbackTypes";
import {
  getProjectViewerStorageKey,
  getProjectViewerRoleStorageKey,
  maskProjectViewerEmail,
} from "@/lib/projectViewerIdentity";

type ProjectFeedbackWorkspaceProps = {
  initialProject: ProjectFeedbackProject;
  allowImageManagement?: boolean;
  showTeamChat?: boolean;
  canInteract?: boolean;
  viewerRole?: ProjectViewerRole;
  projectPath?: string;
  adminAccent?: boolean;
};

type DraftComment = {
  imageId: string;
  x: number;
  y: number;
  color: string;
  content: string;
};

type ImageDimensions = {
  width: number;
  height: number;
};

const commentColorStorageKey = "bs_project_feedback_color";
const defaultCommentColor = "#d88fa2";
const commentColorOptions = [
  "#d88fa2",
  "#e7a27d",
  "#ddb66f",
  "#cfc179",
  "#b7c98b",
  "#97c8a8",
  "#85cbb8",
  "#82c7d3",
  "#93bdf0",
  "#a9b4ee",
  "#c39fdd",
  "#d59cbc",
];

function clampCoordinate(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function editRequestCountLabel(count: number) {
  return `${count} edit request${count === 1 ? "" : "s"}`;
}

function teamMessageCountLabel(count: number) {
  return `${count} message${count === 1 ? "" : "s"}`;
}

function viewerCountLabel(count: number) {
  return `${count} viewer${count === 1 ? "" : "s"}`;
}

function imageDimensionsLabel(dimensions: ImageDimensions | null) {
  if (!dimensions) return null;
  return `${dimensions.width} × ${dimensions.height}px`;
}

function findImageCommentCount(image: ProjectFeedbackImage) {
  return image.comments.length;
}

export function ProjectFeedbackWorkspace({
  initialProject,
  allowImageManagement = false,
  showTeamChat = true,
  canInteract = true,
  viewerRole = "team",
  projectPath,
  adminAccent = false,
}: ProjectFeedbackWorkspaceProps) {
  const [project, setProject] = useState(initialProject);
  const [draft, setDraft] = useState<DraftComment | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(
    initialProject.latestVersion > 0 ? initialProject.latestVersion : null,
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [savedCommentColor, setSavedCommentColor] = useState(defaultCommentColor);
  const [viewerEmail, setViewerEmail] = useState("");
  const resolvedProjectPath = projectPath ?? `/myproject/${initialProject.id}`;
  const resolvedSharePath = `/myproject/${initialProject.id}?viewer=visitor`;
  const [projectUrl, setProjectUrl] = useState(resolvedProjectPath);
  const [shareProjectUrl, setShareProjectUrl] = useState(resolvedSharePath);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [busyImageAction, setBusyImageAction] = useState<"delete" | "replace" | null>(
    null,
  );
  const previousLatestVersionRef = useRef<number | null>(
    initialProject.latestVersion > 0 ? initialProject.latestVersion : null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextViewerEmail =
      window.localStorage.getItem(getProjectViewerStorageKey(project.id)) ?? "";
    setViewerEmail(nextViewerEmail);
    const nextColor =
      window.localStorage.getItem(commentColorStorageKey) ?? defaultCommentColor;
    setSavedCommentColor(
      commentColorOptions.includes(nextColor) ? nextColor : defaultCommentColor,
    );
  }, [project.id]);

  useEffect(() => {
    setProject(initialProject);
    setDraft(null);
    setActiveCommentId(null);
  }, [initialProject]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setProjectUrl(new URL(resolvedProjectPath, window.location.origin).toString());
    setShareProjectUrl(new URL(resolvedSharePath, window.location.origin).toString());
  }, [project.id, resolvedProjectPath, resolvedSharePath]);

  const numberedVersions = useMemo(() => {
    return [...project.versions]
      .sort((a, b) => a.version - b.version)
      .map((versionGroup) => ({
      version: versionGroup.version,
      images: versionGroup.images.map((image, index) => ({
        image,
        imageLabel: `Image ${index + 1}`,
      })),
    }));
  }, [project.versions]);

  useEffect(() => {
    const latestVersion = project.latestVersion > 0 ? project.latestVersion : null;
    const latestChanged = previousLatestVersionRef.current !== latestVersion;
    previousLatestVersionRef.current = latestVersion;

    if (latestVersion === null) {
      setSelectedVersion(null);
      return;
    }

    setSelectedVersion((current) => {
      const currentExists = numberedVersions.some(
        (versionGroup) => versionGroup.version === current,
      );

      if (current === null || !currentExists || latestChanged) {
        return latestVersion;
      }

      return current;
    });
  }, [numberedVersions, project.latestVersion]);

  const activeVersionGroup =
    numberedVersions.find((versionGroup) => versionGroup.version === selectedVersion) ??
    numberedVersions[numberedVersions.length - 1] ??
    null;
  const viewerIdentityLabel = viewerEmail ? maskProjectViewerEmail(viewerEmail) : "";

  const busyNoticeLabel = isUploading
    ? "Adding variant..."
    : busyImageAction === "replace"
      ? "Replacing image..."
      : busyImageAction === "delete"
        ? "Deleting image..."
        : "";
  const canApprove = allowImageManagement || canInteract;
  const showCopyLink = allowImageManagement || viewerRole === "team";
  const showShareLink = !allowImageManagement && viewerRole === "team";

  const resetFeedbackState = (nextProject?: ProjectFeedbackProject) => {
    if (nextProject) {
      setProject(nextProject);
    }
    setDraft(null);
    setActiveCommentId(null);
  };

  const handleCreateDraft = (
    image: ProjectFeedbackImage,
    event: MouseEvent<HTMLDivElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clampCoordinate((event.clientX - rect.left) / rect.width);
    const y = clampCoordinate((event.clientY - rect.top) / rect.height);

    setDraft({
      imageId: image.id,
      x,
      y,
      color: savedCommentColor,
      content: "",
    });
    setActiveCommentId(null);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSubmitComment = async () => {
    if (!draft) return;

    setIsSavingComment(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/project/${project.id}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageId: draft.imageId,
          x: draft.x,
          y: draft.y,
          color: draft.color,
          viewerEmail,
          content: draft.content,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to save edit request.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(commentColorStorageKey, draft.color);
        window.localStorage.setItem(
          getProjectViewerRoleStorageKey(project.id),
          viewerRole,
        );
      }
      setSavedCommentColor(draft.color);
      resetFeedbackState(payload.project);
      setStatusMessage("Edit request saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save edit request.",
      );
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleUploadVersion = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/project/${project.id}/images`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to upload images.");
      }

      resetFeedbackState(payload.project);
      setStatusMessage(`Variant V${payload.project.latestVersion} added.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload images.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const confirmed =
      typeof window === "undefined" ? true : window.confirm("Delete this image?");
    if (!confirmed) return;

    setBusyImageId(imageId);
    setBusyImageAction("delete");
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/project/${project.id}/images/${imageId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to delete image.");
      }

      resetFeedbackState(payload.project);
      setStatusMessage("Image deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete image.",
      );
    } finally {
      setBusyImageId(null);
      setBusyImageAction(null);
    }
  };

  const handleReplaceImage = async (imageId: string, file: File) => {
    setBusyImageId(imageId);
    setBusyImageAction("replace");
    setStatusMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/project/${project.id}/images/${imageId}`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to replace image.");
      }

      resetFeedbackState(payload.project);
      setStatusMessage("Image replaced.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to replace image.",
      );
    } finally {
      setBusyImageId(null);
      setBusyImageAction(null);
    }
  };

  const handleMarkApproved = async () => {
    setIsUpdatingStatus(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/project/${project.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to update status.");
      }

      resetFeedbackState(payload.project);
      setStatusMessage("Project marked as approved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update status.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopyProjectLink = async () => {
    setStatusMessage("");
    setErrorMessage("");

    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error("Clipboard is not available.");
      }

      await navigator.clipboard.writeText(shareProjectUrl);
      setStatusMessage("Project link copied.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to copy project link.",
      );
    }
  };

  const handleShareProjectLink = async () => {
    setStatusMessage("");
    setErrorMessage("");

    try {
      if (typeof navigator === "undefined") {
        throw new Error("Share is not available.");
      }

      if (typeof navigator.share === "function") {
        await navigator.share({
          title: project.name,
          text: `Open the public review link for ${project.name}.`,
          url: shareProjectUrl,
        });
        setStatusMessage("Project link shared.");
        return;
      }

      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard is not available.");
      }

      await navigator.clipboard.writeText(shareProjectUrl);
      setStatusMessage("Project link copied for sharing.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Failed to share project link.",
      );
    }
  };

  return (
    <section
      className="projectFeedbackShell"
      data-admin-view={adminAccent ? "true" : "false"}
    >
      <header className="projectFeedbackHeader">
        <div className="projectFeedbackHeaderTop">
          <div className="projectFeedbackIntro">
            <p className="projectFeedbackEyebrow">Project Review</p>
            <h1 className="projectFeedbackTitle">{project.name}</h1>
            <p className="projectFeedbackMeta projectFeedbackMetaCode">
              {projectUrl}
            </p>
          </div>

          <div className="projectFeedbackActions">
            <span
              className="projectFeedbackStatus"
              data-status={project.status}
            >
              {project.status === "approved" ? "Approved" : "In review"}
            </span>

            {showCopyLink ? (
              <button
                className="projectFeedbackAction projectFeedbackActionGhost"
                type="button"
                onClick={() => void handleCopyProjectLink()}
              >
                Copy link
              </button>
            ) : null}

            {showShareLink ? (
              <button
                className="projectFeedbackAction projectFeedbackActionGhost"
                type="button"
                onClick={() => void handleShareProjectLink()}
              >
                Share link
              </button>
            ) : null}

            {allowImageManagement ? (
              <label className="projectFeedbackUpload">
                <span>{isUploading ? "Adding..." : "Add new variant"}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isUploading}
                  onChange={(event) => {
                    void handleUploadVersion(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            ) : null}

            {canApprove ? (
              <button
                className="projectFeedbackAction projectFeedbackActionSuccess"
                type="button"
                onClick={() => void handleMarkApproved()}
                disabled={isUpdatingStatus || project.status === "approved"}
              >
                {isUpdatingStatus ? "Updating..." : "Mark as approved"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="projectFeedbackSummary">
          <span>
            {project.latestVersion > 0
              ? `Latest variant: V${project.latestVersion}`
              : "No images yet"}
          </span>
          <span>{project.imageCount} image(s)</span>
          <span>{editRequestCountLabel(project.commentCount)}</span>
          <span>{viewerCountLabel(project.viewerCount)}</span>
        </div>

        {busyNoticeLabel ? (
          <div className="projectFeedbackBusyNotice">
            <span className="projectFeedbackSpinner" aria-hidden="true" />
            <span>{busyNoticeLabel}</span>
          </div>
        ) : null}

        {statusMessage ? (
          <p className="projectFeedbackMessage">{statusMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="projectFeedbackMessage projectFeedbackMessageError">
            {errorMessage}
          </p>
        ) : null}
      </header>

      {project.versions.length > 0 ? (
        <>
          <div
            className="projectFeedbackVersionTabs"
            role="tablist"
            aria-label="Project variants"
          >
            {numberedVersions.map((versionGroup) => (
              <button
                key={versionGroup.version}
                className="projectFeedbackVersionTab"
                type="button"
                role="tab"
                data-active={
                  activeVersionGroup?.version === versionGroup.version ? "true" : "false"
                }
                aria-selected={activeVersionGroup?.version === versionGroup.version}
                onClick={() => {
                  setSelectedVersion(versionGroup.version);
                  setDraft(null);
                  setActiveCommentId(null);
                }}
              >
                {`V${versionGroup.version}`}
              </button>
            ))}
          </div>

          <div className="projectFeedbackVersions">
            {activeVersionGroup ? (
              <div className="projectFeedbackVersion">
                <div className="projectFeedbackVersionImages">
                  {activeVersionGroup.images.map(({ image, imageLabel }) => (
                    <ProjectFeedbackImageCard
                      key={image.id}
                      image={image}
                      projectId={project.id}
                      imageLabel={imageLabel}
                      activeCommentId={activeCommentId}
                      draft={draft}
                      isSavingComment={isSavingComment}
                      isBusy={busyImageId === image.id}
                      busyActionLabel={
                        busyImageId === image.id && busyImageAction
                          ? busyImageAction === "replace"
                            ? "Replacing..."
                            : "Deleting..."
                          : null
                      }
                      showImageActions={allowImageManagement}
                      showDownloadAction={
                        project.status === "approved" && !allowImageManagement
                      }
                      showTeamChat={showTeamChat}
                      canInteract={canInteract}
                      viewerRole={viewerRole}
                      viewerIdentityLabel={viewerIdentityLabel}
                      viewerEmail={viewerEmail}
                      onImageClick={handleCreateDraft}
                      onDeleteImage={(imageId) => {
                        void handleDeleteImage(imageId);
                      }}
                      onReplaceImage={(imageId, file) => {
                        void handleReplaceImage(imageId, file);
                      }}
                      onDraftChange={setDraft}
                      onDraftCancel={() => setDraft(null)}
                      onDraftSubmit={() => void handleSubmitComment()}
                      onCommentSelect={(commentId) => {
                        setActiveCommentId(commentId);
                        setDraft(null);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="projectFeedbackEmpty">
          <h2 className="projectFeedbackVersionTitle">No images yet</h2>
          <p className="projectFeedbackVersionMeta">
            Add the first variant to start collecting edit requests.
          </p>
        </div>
      )}
    </section>
  );
}

type ProjectFeedbackImageCardProps = {
  projectId: string;
  image: ProjectFeedbackImage;
  imageLabel: string;
  viewerIdentityLabel: string;
  viewerEmail: string;
  activeCommentId: string | null;
  draft: DraftComment | null;
  isSavingComment: boolean;
  isBusy: boolean;
  busyActionLabel: string | null;
  showImageActions: boolean;
  showDownloadAction: boolean;
  showTeamChat: boolean;
  canInteract: boolean;
  viewerRole: ProjectViewerRole;
  onImageClick: (
    image: ProjectFeedbackImage,
    event: MouseEvent<HTMLDivElement>,
  ) => void;
  onDeleteImage: (imageId: string) => void;
  onReplaceImage: (imageId: string, file: File) => void;
  onDraftChange: Dispatch<SetStateAction<DraftComment | null>>;
  onDraftCancel: () => void;
  onDraftSubmit: () => void;
  onCommentSelect: (commentId: string) => void;
};

function ProjectFeedbackImageCard({
  projectId,
  image,
  imageLabel,
  viewerIdentityLabel,
  viewerEmail,
  activeCommentId,
  draft,
  isSavingComment,
  isBusy,
  busyActionLabel,
  showImageActions,
  showDownloadAction,
  showTeamChat,
  canInteract,
  viewerRole,
  onImageClick,
  onDeleteImage,
  onReplaceImage,
  onDraftChange,
  onDraftCancel,
  onDraftSubmit,
  onCommentSelect,
}: ProjectFeedbackImageCardProps) {
  const draftForImage = draft?.imageId === image.id ? draft : null;
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const dimensionsLabel = imageDimensionsLabel(dimensions);
  const hasTeamChat = showTeamChat;
  const canPost = canInteract && viewerEmail.length > 0;
  const downloadHref = `/api/project/${projectId}/images/${image.id}/download`;
  const draftHorizontalOffset = draftForImage
    ? draftForImage.x > 0.72
      ? "calc(-100% - 12px)"
      : draftForImage.x < 0.28
        ? "12px"
        : "-50%"
    : "-50%";
  const draftVerticalOffset = draftForImage
    ? draftForImage.y > 0.62
      ? "calc(-100% - 12px)"
      : "12px"
    : "12px";

  const handleReplaceInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    onReplaceImage(image.id, file);
  };

  return (
    <article
      className="projectFeedbackImageCard"
      data-team-chat={hasTeamChat ? "true" : "false"}
      data-can-interact={canInteract ? "true" : "false"}
    >
      <div className="projectFeedbackImageCardHeader">
        <div className="projectFeedbackImageCardCopy">
          <h3 className="projectFeedbackImageTitle">
            <span className="projectFeedbackImageTitleLabel">{imageLabel}</span>
            {dimensionsLabel ? (
              <span className="projectFeedbackImageTitleDimensions">
                - {dimensionsLabel}
              </span>
            ) : null}
          </h3>
        </div>

        {showImageActions || showDownloadAction ? (
          <div className="projectFeedbackImageActions">
            {showDownloadAction ? (
              <a className="projectFeedbackMiniAction" href={downloadHref}>
                Download
              </a>
            ) : null}
            {showImageActions ? (
              <>
                <button
                  className="projectFeedbackMiniAction"
                  type="button"
                  disabled={isBusy}
                  onClick={() => replaceInputRef.current?.click()}
                >
                  {isBusy && busyActionLabel === "Replacing..." ? "Replacing..." : "Replace"}
                </button>
                <button
                  className="projectFeedbackMiniAction projectFeedbackMiniActionDanger"
                  type="button"
                  disabled={isBusy}
                  onClick={() => onDeleteImage(image.id)}
                >
                  {isBusy && busyActionLabel === "Deleting..." ? "Deleting..." : "Delete"}
                </button>
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleReplaceInput}
                />
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        className="projectFeedbackCanvas"
        data-interactive={canInteract ? "true" : "false"}
        onClick={(event) => {
          if (isBusy || !canInteract) return;
          onImageClick(image, event);
        }}
      >
        <img
          className="projectFeedbackImage"
          src={image.url}
          alt={imageLabel}
          loading="lazy"
          decoding="async"
          onLoad={(event) => {
            setDimensions({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            });
          }}
          onError={() => setDimensions(null)}
        />

        {image.comments.map((comment, index) => (
          <ProjectFeedbackMarker
            key={comment.id}
            comment={comment}
            index={index}
            isActive={activeCommentId === comment.id}
            onSelect={onCommentSelect}
          />
        ))}

        {draftForImage ? (
          <form
            className="projectFeedbackDraft"
            style={{
              left: `${draftForImage.x * 100}%`,
              top: `${draftForImage.y * 100}%`,
              "--draft-translate-x": draftHorizontalOffset,
              "--draft-translate-y": draftVerticalOffset,
            } as CSSProperties}
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              if (!canPost) return;
              onDraftSubmit();
            }}
          >
            <div className="projectFeedbackIdentityTag">
              {!canInteract
                ? "Visitor mode is read-only for edit requests."
                : viewerIdentityLabel
                ? `Posting as ${viewerIdentityLabel}`
                : "Open the project with your email to post an edit request."}
            </div>

            <label className="projectFeedbackField">
              <span>Edit Request</span>
              <textarea
                className="projectFeedbackTextarea"
                value={draftForImage.content}
                onChange={(event) =>
                  onDraftChange((current) =>
                    current && current.imageId === image.id
                      ? { ...current, content: event.target.value }
                      : current,
                  )
                }
                placeholder="Describe the requested change"
                required
              />
            </label>

            <div className="projectFeedbackField">
              <span>Color</span>
              <div className="projectFeedbackColorOptions" role="group" aria-label="Comment color">
                {commentColorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    className="projectFeedbackColorOption"
                    type="button"
                    data-active={draftForImage.color === colorOption ? "true" : "false"}
                    style={{ "--comment-color": colorOption } as CSSProperties}
                    aria-label={`Select color ${colorOption}`}
                    onClick={() =>
                      onDraftChange((current) =>
                        current && current.imageId === image.id
                          ? { ...current, color: colorOption }
                          : current,
                      )
                    }
                  >
                    <span />
                  </button>
                ))}
              </div>
            </div>

            <div className="projectFeedbackDraftActions">
              <button
                className="projectFeedbackAction"
                type="submit"
                disabled={isSavingComment || !canPost}
              >
                {isSavingComment ? "Saving..." : "Save edit request"}
              </button>
              <button
                className="projectFeedbackAction projectFeedbackActionGhost"
                type="button"
                onClick={onDraftCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <aside className="projectFeedbackComments">
        <div className="projectFeedbackCommentsHeader">
          <h3 className="projectFeedbackCommentsTitle">Edit Requests</h3>
          <div className="projectFeedbackCommentsMetaGroup">
            <p className="projectFeedbackCommentsMeta">
              {editRequestCountLabel(findImageCommentCount(image))}
            </p>
          </div>
        </div>

        {image.comments.length > 0 ? (
          <div className="projectFeedbackCommentWindow">
            <div className="projectFeedbackCommentList">
              {image.comments.map((comment, index) => (
                <button
                  key={comment.id}
                  className="projectFeedbackCommentItem"
                  type="button"
                  data-active={activeCommentId === comment.id ? "true" : "false"}
                  style={{ "--comment-color": comment.color } as CSSProperties}
                  onClick={() => onCommentSelect(comment.id)}
                >
                  <span className="projectFeedbackCommentIndex">{index + 1}</span>
                  <span className="projectFeedbackCommentBody">
                    <strong>{comment.author}</strong>
                    <span>{comment.content}</span>
                    <span>{formatTimestamp(comment.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="projectFeedbackCommentsMeta">
            {canInteract
              ? "Click on the image to add the first edit request."
              : "Visitor mode is view-only for edit requests."}
          </p>
        )}
      </aside>

      {hasTeamChat ? (
        <ProjectFeedbackTeamChat
          projectId={projectId}
          imageId={image.id}
          viewerEmail={viewerEmail}
          viewerIdentityLabel={viewerIdentityLabel}
          canInteract={canInteract}
          viewerRole={viewerRole}
        />
      ) : null}
    </article>
  );
}

type ProjectFeedbackTeamChatProps = {
  projectId: string;
  imageId: string;
  viewerEmail: string;
  viewerIdentityLabel: string;
  canInteract: boolean;
  viewerRole: ProjectViewerRole;
};

function ProjectFeedbackTeamChat({
  projectId,
  imageId,
  viewerEmail,
  viewerIdentityLabel,
  canInteract,
  viewerRole,
}: ProjectFeedbackTeamChatProps) {
  const [messages, setMessages] = useState<ProjectFeedbackTeamMessage[]>([]);
  const [content, setContent] = useState("");
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const canPost = canInteract && viewerEmail.length > 0;
  const replyTarget =
    messages.find((message) => message.id === replyTargetId) ?? null;

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `/api/project/${projectId}/images/${imageId}/team-chat`,
          {
            cache: "no-store",
          },
        );

        const payload = (await response.json().catch(() => null)) as
          | { messages?: ProjectFeedbackTeamMessage[]; error?: string }
          | null;

        if (!response.ok || !payload?.messages) {
          throw new Error(payload?.error ?? "Failed to load team chat.");
        }

        if (!cancelled) {
          setMessages(payload.messages);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load team chat.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [imageId, projectId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || !canPost) return;

    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/project/${projectId}/images/${imageId}/team-chat`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            viewerEmail,
            content: trimmedContent,
            replyToMessageId: replyTargetId,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { message?: ProjectFeedbackTeamMessage; error?: string }
        | null;

      if (!response.ok || !payload?.message) {
        throw new Error(payload?.error ?? "Failed to send team chat message.");
      }

      setMessages((current) => [...current, payload.message!]);
      setContent("");
      setReplyTargetId(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to send team chat message.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="projectFeedbackTeamChat">
      <div className="projectFeedbackCommentsHeader">
        <h3 className="projectFeedbackCommentsTitle">Team Chat</h3>
        <div className="projectFeedbackCommentsMetaGroup">
          <p className="projectFeedbackCommentsMeta">
            {teamMessageCountLabel(messages.length)}
          </p>
        </div>
      </div>

      <div className="projectFeedbackTeamChatPanel">
        <div className="projectFeedbackTeamChatMessages" ref={listRef}>
          {isLoading ? (
            <p className="projectFeedbackCommentsMeta">Loading team chat...</p>
          ) : messages.length > 0 ? (
            <div className="projectFeedbackTeamChatList">
              {messages.map((message) => {
                const isMine =
                  viewerIdentityLabel.length > 0 &&
                  message.author === viewerIdentityLabel;

                return (
                  <article
                    key={message.id}
                    className="projectFeedbackTeamChatMessage"
                    data-mine={isMine ? "true" : "false"}
                  >
                    <div className="projectFeedbackTeamChatMessageHeader">
                      <strong>{message.author}</strong>
                      <span>{formatTimestamp(message.createdAt)}</span>
                    </div>

                    {message.replyToMessageId ? (
                      <div className="projectFeedbackTeamChatReplyPreview">
                        <strong>{message.replyToAuthor ?? "Reply"}</strong>
                        <span>{message.replyToContent ?? "Message unavailable"}</span>
                      </div>
                    ) : null}

                    <p>{message.content}</p>

                    {canInteract ? (
                      <div className="projectFeedbackTeamChatMessageActions">
                        <button
                          className="projectFeedbackTeamChatReplyButton"
                          type="button"
                          onClick={() => setReplyTargetId(message.id)}
                        >
                          Reply
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="projectFeedbackCommentsMeta">
              No team messages yet for this image.
            </p>
          )}
        </div>

        <form
          className="projectFeedbackTeamChatComposer"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="projectFeedbackIdentityTag">
            {!canInteract
              ? viewerRole === "visitor"
                ? "Visitor mode is read-only for team chat."
                : "Team member access is required to join the team chat."
              : viewerIdentityLabel
              ? `Posting as ${viewerIdentityLabel}`
              : "Open the project with your email to join the team chat."}
          </div>

          {replyTarget ? (
            <div className="projectFeedbackTeamChatReplyComposer">
              <div className="projectFeedbackTeamChatReplyPreview">
                <strong>{replyTarget.author}</strong>
                <span>{replyTarget.content}</span>
              </div>
              <button
                className="projectFeedbackTeamChatReplyButton"
                type="button"
                onClick={() => setReplyTargetId(null)}
              >
                Cancel reply
              </button>
            </div>
          ) : null}

          <label className="projectFeedbackField">
            <span>Message</span>
            <textarea
              className="projectFeedbackTextarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={
                canPost
                  ? "Write a message about this image"
                  : "Open the project with your email to chat"
              }
              required
              disabled={!canPost || isSending}
            />
          </label>

          <div className="projectFeedbackDraftActions">
            <button
              className="projectFeedbackAction"
              type="submit"
              disabled={isSending || !canPost}
            >
              {isSending ? "Sending..." : "Send message"}
            </button>
          </div>

          {errorMessage ? (
            <p className="projectFeedbackMessage projectFeedbackMessageError">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>
    </aside>
  );
}

type ProjectFeedbackMarkerProps = {
  comment: ProjectFeedbackComment;
  index: number;
  isActive: boolean;
  onSelect: (commentId: string) => void;
};

function ProjectFeedbackMarker({
  comment,
  index,
  isActive,
  onSelect,
}: ProjectFeedbackMarkerProps) {
  const tooltipSide = comment.x > 0.72 ? "left" : "right";
  const tooltipPosition =
    comment.y > 0.72 ? "above" : comment.y < 0.28 ? "below" : "center";

  return (
    <button
      className="projectFeedbackMarker"
      type="button"
      data-active={isActive ? "true" : "false"}
      style={{
        "--comment-color": comment.color,
        left: `${comment.x * 100}%`,
        top: `${comment.y * 100}%`,
      } as CSSProperties}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(comment.id);
      }}
    >
      <span>{index + 1}</span>
      {isActive ? (
        <span
          className="projectFeedbackTooltip"
          data-side={tooltipSide}
          data-position={tooltipPosition}
        >
          <strong>{comment.author}</strong>
          <span>{comment.content}</span>
        </span>
      ) : null}
    </button>
  );
}
