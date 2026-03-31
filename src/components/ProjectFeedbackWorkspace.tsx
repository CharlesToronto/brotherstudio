"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEvent,
  Dispatch,
  MouseEvent,
  SetStateAction,
} from "react";

import type {
  ProjectFeedbackComment,
  ProjectFeedbackProject,
  ProjectFeedbackImage,
} from "@/lib/projectFeedbackTypes";

type ProjectFeedbackWorkspaceProps = {
  initialProject: ProjectFeedbackProject;
};

type DraftComment = {
  imageId: string;
  x: number;
  y: number;
  author: string;
  content: string;
};

type ImageDimensions = {
  width: number;
  height: number;
};

const authorStorageKey = "bs_project_feedback_author";

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

function commentCountLabel(count: number) {
  return `${count} comment${count === 1 ? "" : "s"}`;
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
}: ProjectFeedbackWorkspaceProps) {
  const [project, setProject] = useState(initialProject);
  const [draft, setDraft] = useState<DraftComment | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [savedAuthor, setSavedAuthor] = useState("");
  const [projectUrl, setProjectUrl] = useState(`/myproject/${initialProject.id}`);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [busyImageAction, setBusyImageAction] = useState<"delete" | "replace" | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextAuthor = window.localStorage.getItem(authorStorageKey) ?? "";
    setSavedAuthor(nextAuthor);
  }, []);

  useEffect(() => {
    setProject(initialProject);
    setDraft(null);
    setActiveCommentId(null);
  }, [initialProject]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setProjectUrl(window.location.href);
  }, [project.id]);

  const numberedVersions = useMemo(() => {
    let imageNumber = 0;

    return project.versions.map((versionGroup) => ({
      version: versionGroup.version,
      images: versionGroup.images.map((image) => ({
        image,
        imageLabel: `Image ${++imageNumber}`,
        uploadLabel: `Upload ${versionGroup.version}`,
      })),
    }));
  }, [project.versions]);

  const busyNoticeLabel = isUploading
    ? "Uploading images..."
    : busyImageAction === "replace"
      ? "Replacing image..."
      : busyImageAction === "delete"
        ? "Deleting image..."
        : "";

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
      author: savedAuthor,
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
          author: draft.author,
          content: draft.content,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to save comment.");
      }

      const author = draft.author.trim();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(authorStorageKey, author);
      }
      setSavedAuthor(author);
      resetFeedbackState(payload.project);
      setStatusMessage("Comment saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save comment.",
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
      setStatusMessage(`Upload ${payload.project.latestVersion} added.`);
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

  return (
    <section className="projectFeedbackShell">
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

            <label className="projectFeedbackUpload">
              <span>{isUploading ? "Uploading..." : "Upload images"}</span>
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

            <button
              className="projectFeedbackAction"
              type="button"
              onClick={() => void handleMarkApproved()}
              disabled={isUpdatingStatus || project.status === "approved"}
            >
              {isUpdatingStatus ? "Updating..." : "Mark as approved"}
            </button>
          </div>
        </div>

        <div className="projectFeedbackSummary">
          <span>
            {project.latestVersion > 0
              ? `Latest upload: ${project.latestVersion}`
              : "No images yet"}
          </span>
          <span>{project.imageCount} image(s)</span>
          <span>{project.commentCount} comment(s)</span>
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
        <div className="projectFeedbackVersions">
          {numberedVersions.map((versionGroup) => (
            <section
              key={versionGroup.version}
              className="projectFeedbackVersion"
              aria-labelledby={`project-version-${versionGroup.version}`}
            >
              <div className="projectFeedbackVersionHeader">
                <h2
                  id={`project-version-${versionGroup.version}`}
                  className="projectFeedbackVersionTitle"
                >
                  Upload {versionGroup.version}
                </h2>
                <p className="projectFeedbackVersionMeta">
                  {versionGroup.images.length} image(s)
                </p>
              </div>

              <div className="projectFeedbackVersionImages">
                {versionGroup.images.map(({ image, imageLabel, uploadLabel }) => (
                  <ProjectFeedbackImageCard
                    key={image.id}
                    image={image}
                    imageLabel={imageLabel}
                    uploadLabel={uploadLabel}
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
            </section>
          ))}
        </div>
      ) : (
        <div className="projectFeedbackEmpty">
          <h2 className="projectFeedbackVersionTitle">No images yet</h2>
          <p className="projectFeedbackVersionMeta">
            Upload the first images to start collecting comments.
          </p>
        </div>
      )}
    </section>
  );
}

type ProjectFeedbackImageCardProps = {
  image: ProjectFeedbackImage;
  imageLabel: string;
  uploadLabel: string;
  activeCommentId: string | null;
  draft: DraftComment | null;
  isSavingComment: boolean;
  isBusy: boolean;
  busyActionLabel: string | null;
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
  image,
  imageLabel,
  uploadLabel,
  activeCommentId,
  draft,
  isSavingComment,
  isBusy,
  busyActionLabel,
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

  const handleReplaceInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    onReplaceImage(image.id, file);
  };

  return (
    <article className="projectFeedbackImageCard">
      <div className="projectFeedbackImageCardHeader">
        <div className="projectFeedbackImageCardCopy">
          <h3 className="projectFeedbackImageTitle">{imageLabel}</h3>
          <p className="projectFeedbackImageMeta">{uploadLabel}</p>
        </div>

        <div className="projectFeedbackImageActions">
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
        </div>
      </div>

      <div
        className="projectFeedbackCanvas"
        onClick={(event) => {
          if (isBusy) return;
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
            }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              onDraftSubmit();
            }}
          >
            <label className="projectFeedbackField">
              <span>Name</span>
              <input
                className="projectFeedbackInput"
                type="text"
                value={draftForImage.author}
                onChange={(event) =>
                  onDraftChange((current) =>
                    current && current.imageId === image.id
                      ? { ...current, author: event.target.value }
                      : current,
                  )
                }
                placeholder="Your name"
              />
            </label>

            <label className="projectFeedbackField">
              <span>Comment</span>
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

            <div className="projectFeedbackDraftActions">
              <button
                className="projectFeedbackAction"
                type="submit"
                disabled={isSavingComment}
              >
                {isSavingComment ? "Saving..." : "Save comment"}
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
          <h3 className="projectFeedbackCommentsTitle">Comments</h3>
          <div className="projectFeedbackCommentsMetaGroup">
            <p className="projectFeedbackCommentsMeta">
              {commentCountLabel(findImageCommentCount(image))}
            </p>
            {imageDimensionsLabel(dimensions) ? (
              <p className="projectFeedbackCommentsMeta">
                {imageDimensionsLabel(dimensions)}
              </p>
            ) : null}
          </div>
        </div>

        {image.comments.length > 0 ? (
          <div className="projectFeedbackCommentList">
            {image.comments.map((comment, index) => (
              <button
                key={comment.id}
                className="projectFeedbackCommentItem"
                type="button"
                data-active={activeCommentId === comment.id ? "true" : "false"}
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
        ) : (
          <p className="projectFeedbackCommentsMeta">
            Click on the image to add the first comment.
          </p>
        )}
      </aside>
    </article>
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
  return (
    <button
      className="projectFeedbackMarker"
      type="button"
      data-active={isActive ? "true" : "false"}
      style={{
        left: `${comment.x * 100}%`,
        top: `${comment.y * 100}%`,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(comment.id);
      }}
    >
      <span>{index + 1}</span>
      {isActive ? (
        <span className="projectFeedbackTooltip">
          <strong>{comment.author}</strong>
          <span>{comment.content}</span>
        </span>
      ) : null}
    </button>
  );
}
