"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  ChangeEvent,
  Dispatch,
  MouseEvent,
  PointerEvent,
  SetStateAction,
} from "react";

import type {
  ProjectFeedbackComment,
  ProjectFeedbackDrawingElement,
  ProjectFeedbackDrawingLayer,
  ProjectFeedbackDrawingPoint,
  ProjectFeedbackProject,
  ProjectFeedbackImage,
  ProjectFeedbackTeamMessage,
  ProjectStatus,
  ProjectViewerRole,
} from "@/lib/projectFeedbackTypes";
import { getResponseErrorMessage } from "@/lib/errorMessage";
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
  adminAccent?: boolean;
};

type DraftComment = {
  imageId: string;
  x: number;
  y: number;
  color: string;
  content: string;
};

type EditingComment = {
  id: string;
  imageId: string;
  color: string;
  content: string;
};

type ImageDimensions = {
  width: number;
  height: number;
};

type WorkspaceTab = "review" | "approved";
type ImageSidePanelTab = "requests" | "chat" | "drawing";
type DrawingTool = "freehand" | "line" | "rectangle" | "circle" | "eraser";
type ShapeDrawingTool = Exclude<DrawingTool, "eraser">;

type DrawingStrokeDraft =
  | {
      type: "freehand";
      color: string;
      strokeWidth: number;
      points: ProjectFeedbackDrawingPoint[];
    }
  | {
      type: "line" | "rectangle" | "circle";
      color: string;
      strokeWidth: number;
      start: ProjectFeedbackDrawingPoint;
      end: ProjectFeedbackDrawingPoint;
    };

type VersionImageEntry = {
  image: ProjectFeedbackImage;
  imageLabel: string;
};

type NumberedVersionGroup = {
  version: number;
  images: VersionImageEntry[];
};

const commentColorStorageKey = "bs_project_feedback_color";
const defaultCommentColor = "#d88fa2";
const teamChatPollIntervalMs = 1500;
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

const teamChatBubblePalettes = [
  { background: "#eef4ff", border: "#bfd3ff", accent: "#4f7df0" },
  { background: "#fdf0f4", border: "#f3c1d2", accent: "#d86d97" },
  { background: "#f6f1ff", border: "#d8c4ff", accent: "#8b67dd" },
  { background: "#eefaf4", border: "#bfe6ce", accent: "#54a16f" },
  { background: "#fff6ec", border: "#f2d2b2", accent: "#cf8b42" },
  { background: "#eef8fb", border: "#b9dce7", accent: "#4d95ac" },
];

const drawingStrokeWidths = [2, 4, 6, 8];
const emptyCountBadgeStyle: CSSProperties = {
  background: "#ececec",
  color: "#7a7a7a",
};

function clampCoordinate(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getTeamChatBubblePalette(author: string) {
  const normalizedAuthor = author.trim().toLowerCase();
  const palette =
    teamChatBubblePalettes[
      hashString(normalizedAuthor) % teamChatBubblePalettes.length
    ] ?? teamChatBubblePalettes[0];

  return palette;
}

function drawingPointDistance(
  first: ProjectFeedbackDrawingPoint,
  second: ProjectFeedbackDrawingPoint,
) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function distanceToSegment(
  point: ProjectFeedbackDrawingPoint,
  start: ProjectFeedbackDrawingPoint,
  end: ProjectFeedbackDrawingPoint,
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return drawingPointDistance(point, start);
  }

  const projection =
    ((point.x - start.x) * dx + (point.y - start.y) * dy) /
    (dx * dx + dy * dy);
  const clampedProjection = Math.min(Math.max(projection, 0), 1);

  return Math.hypot(
    point.x - (start.x + clampedProjection * dx),
    point.y - (start.y + clampedProjection * dy),
  );
}

function getDrawingHitThreshold(strokeWidth: number) {
  return Math.max(0.014, strokeWidth / 260);
}

function isPointNearDrawingElement(
  point: ProjectFeedbackDrawingPoint,
  element: ProjectFeedbackDrawingElement,
) {
  const threshold = getDrawingHitThreshold(element.strokeWidth);

  if (element.type === "freehand") {
    for (let index = 0; index < element.points.length - 1; index += 1) {
      if (
        distanceToSegment(point, element.points[index], element.points[index + 1]) <=
        threshold
      ) {
        return true;
      }
    }
    return false;
  }

  if (element.type === "line") {
    return distanceToSegment(point, element.start, element.end) <= threshold;
  }

  if (element.type === "rectangle") {
    const minX = Math.min(element.start.x, element.end.x) - threshold;
    const maxX = Math.max(element.start.x, element.end.x) + threshold;
    const minY = Math.min(element.start.y, element.end.y) - threshold;
    const maxY = Math.max(element.start.y, element.end.y) + threshold;

    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }

  const centerX = (element.start.x + element.end.x) / 2;
  const centerY = (element.start.y + element.end.y) / 2;
  const radiusX = Math.abs(element.end.x - element.start.x) / 2;
  const radiusY = Math.abs(element.end.y - element.start.y) / 2;

  if (radiusX < 0.001 || radiusY < 0.001) {
    return drawingPointDistance(point, { x: centerX, y: centerY }) <= threshold;
  }

  const normalizedDistance =
    ((point.x - centerX) ** 2) / (radiusX + threshold) ** 2 +
    ((point.y - centerY) ** 2) / (radiusY + threshold) ** 2;

  return normalizedDistance <= 1.08;
}

function getSvgCoordinateValue(value: number) {
  return Math.round(clampCoordinate(value) * 1000);
}

function getDrawingPointFromEvent(
  event: PointerEvent<SVGSVGElement>,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: clampCoordinate((event.clientX - rect.left) / rect.width),
    y: clampCoordinate((event.clientY - rect.top) / rect.height),
  };
}

function createDrawingElementFromDraft(
  draft: DrawingStrokeDraft,
): ProjectFeedbackDrawingElement | null {
  if (draft.type === "freehand") {
    if (draft.points.length < 2) return null;
    return {
      id: createId(),
      type: "freehand",
      color: draft.color,
      strokeWidth: draft.strokeWidth,
      points: draft.points,
    };
  }

  if (
    Math.abs(draft.start.x - draft.end.x) < 0.001 &&
    Math.abs(draft.start.y - draft.end.y) < 0.001
  ) {
    return null;
  }

  return {
    id: createId(),
    type: draft.type,
    color: draft.color,
    strokeWidth: draft.strokeWidth,
    start: draft.start,
    end: draft.end,
  };
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

function formatFileSizeMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function uploadFileToSignedUrl(input: {
  signedUrl: string;
  file: File;
}) {
  const formData = new FormData();
  formData.append("cacheControl", "31536000");
  formData.append("", input.file);

  const response = await fetch(input.signedUrl, {
    method: "PUT",
    headers: {
      "x-upsert": "false",
    },
    body: formData,
  });

  if (!response.ok) {
    const responseMessage = await response.text().catch(() => "");
    throw new Error(
      responseMessage.trim() ||
        `${input.file.name} (${formatFileSizeMb(input.file.size)}) failed during direct storage upload.`,
    );
  }
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
  const resolvedSharePath = `/mystudio/${initialProject.id}`;
  const [shareProjectUrl, setShareProjectUrl] = useState(resolvedSharePath);
  const [isCopyLinkCopied, setIsCopyLinkCopied] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [busyImageAction, setBusyImageAction] = useState<"delete" | "replace" | null>(
    null,
  );
  const [editingComment, setEditingComment] = useState<EditingComment | null>(null);
  const [busyCommentId, setBusyCommentId] = useState<string | null>(null);
  const [busyCommentAction, setBusyCommentAction] = useState<"update" | "delete" | null>(
    null,
  );
  const [busyImageStatusId, setBusyImageStatusId] = useState<string | null>(null);
  const [busyImageStatus, setBusyImageStatus] = useState<ProjectStatus | null>(null);
  const [isDownloadingApproved, setIsDownloadingApproved] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>(() => {
    const approvedCount = initialProject.versions.reduce(
      (total, versionGroup) =>
        total +
        versionGroup.images.filter((image) => image.status === "approved").length,
      0,
    );
    const reviewCount = initialProject.versions.reduce(
      (total, versionGroup) =>
        total + versionGroup.images.length,
      0,
    );

    return reviewCount === 0 && approvedCount > 0 ? "approved" : "review";
  });
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
    setEditingComment(null);
    setActiveCommentId(null);
    setSelectedVersion(initialProject.latestVersion > 0 ? initialProject.latestVersion : null);
    previousLatestVersionRef.current =
      initialProject.latestVersion > 0 ? initialProject.latestVersion : null;
  }, [initialProject]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShareProjectUrl(new URL(resolvedSharePath, window.location.origin).toString());
  }, [project.id, resolvedSharePath]);

  useEffect(() => {
    if (!isCopyLinkCopied) return;
    const timeoutId = window.setTimeout(() => {
      setIsCopyLinkCopied(false);
    }, 1600);

    return () => window.clearTimeout(timeoutId);
  }, [isCopyLinkCopied]);

  const numberedVersions = useMemo<NumberedVersionGroup[]>(() => {
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

  const reviewVersions = useMemo(
    () => numberedVersions,
    [numberedVersions],
  );

  const approvedImages = useMemo(
    () =>
      numberedVersions
        .flatMap((versionGroup) =>
          versionGroup.images
            .filter(({ image }) => image.status === "approved")
            .map(({ image, imageLabel }) => ({
              image,
              imageLabel,
              version: versionGroup.version,
            })),
        )
        .sort((a, b) => {
          if (a.version !== b.version) return b.version - a.version;
          return b.image.createdAt.localeCompare(a.image.createdAt);
        }),
    [numberedVersions],
  );

  const reviewImageCount = reviewVersions.reduce(
    (total, versionGroup) => total + versionGroup.images.length,
    0,
  );
  const approvedImageCount = approvedImages.length;

  useEffect(() => {
    const latestVersion =
      reviewVersions.length > 0
        ? reviewVersions[reviewVersions.length - 1]?.version ?? null
        : null;
    const latestChanged = previousLatestVersionRef.current !== latestVersion;
    previousLatestVersionRef.current = latestVersion;

    if (latestVersion === null) {
      setSelectedVersion(null);
      return;
    }

    setSelectedVersion((current) => {
      const currentExists = reviewVersions.some(
        (versionGroup) => versionGroup.version === current,
      );

      if (current === null || !currentExists || latestChanged) {
        return latestVersion;
      }

      return current;
    });
  }, [reviewVersions]);

  useEffect(() => {
    setActiveWorkspaceTab((current) => {
      if (current === "review" && reviewImageCount > 0) return current;
      if (current === "approved" && approvedImageCount > 0) return current;
      if (reviewImageCount === 0 && approvedImageCount > 0) return "approved";
      return "review";
    });
  }, [approvedImageCount, reviewImageCount]);

  const activeVersionGroup =
    reviewVersions.find((versionGroup) => versionGroup.version === selectedVersion) ??
    reviewVersions[reviewVersions.length - 1] ??
    null;
  const viewerIdentityLabel = viewerEmail ? maskProjectViewerEmail(viewerEmail) : "";
  const canManageApprovedImages = allowImageManagement || canInteract;

  const busyNoticeLabel = isUploading
    ? "Adding variant..."
    : busyImageAction === "replace"
      ? "Replacing image..."
      : busyImageAction === "delete"
        ? "Deleting image..."
        : busyImageStatus === "approved"
          ? "Approving image..."
          : busyImageStatus === "in_review"
            ? "Removing approved state..."
            : isDownloadingApproved
              ? "Preparing downloads..."
              : "";
  const canApprove = allowImageManagement || canInteract;
  const showCopyLink = allowImageManagement || viewerRole === "team";
  const showShareLink = !allowImageManagement && viewerRole === "team";
  const showParcelNumberInTitle =
    Boolean(project.accessPassword) && (allowImageManagement || canInteract);
  const projectTitle = showParcelNumberInTitle
    ? `${project.name} - ${project.accessPassword}`
    : project.name;

  const resetFeedbackState = (nextProject?: ProjectFeedbackProject) => {
    if (nextProject) {
      setProject(nextProject);
    }
    setDraft(null);
    setEditingComment(null);
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
      const uploadRouteBase = allowImageManagement
        ? `/api/projects/${project.id}/images`
        : `/api/project/${project.id}/images`;
      const selectedFiles = Array.from(files);
      const prepareResponse = await fetch(uploadRouteBase, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "prepare-upload",
          files: selectedFiles.map((file) => ({
            name: file.name,
            type: file.type,
          })),
        }),
      });

      if (!prepareResponse.ok) {
        throw new Error(
          await getResponseErrorMessage(prepareResponse, "Failed to upload images."),
        );
      }

      const preparePayload = (await prepareResponse.json().catch(() => null)) as
        | {
            version?: number;
            uploads?: Array<{ signedUrl: string; publicUrl: string }>;
          }
        | null;

      if (
        !preparePayload ||
        typeof preparePayload.version !== "number" ||
        !Array.isArray(preparePayload.uploads) ||
        preparePayload.uploads.length !== selectedFiles.length
      ) {
        throw new Error("Failed to upload images.");
      }

      for (const [index, file] of selectedFiles.entries()) {
        const upload = preparePayload.uploads[index];
        await uploadFileToSignedUrl({
          signedUrl: upload.signedUrl,
          file,
        });
      }

      const commitResponse = await fetch(uploadRouteBase, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "commit-upload",
          version: preparePayload.version,
          uploads: preparePayload.uploads.map((upload) => ({
            publicUrl: upload.publicUrl,
          })),
        }),
      });

      if (!commitResponse.ok) {
        throw new Error(
          await getResponseErrorMessage(commitResponse, "Failed to upload images."),
        );
      }

      const commitPayload = (await commitResponse.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; version?: number }
        | null;

      if (!commitPayload?.project) {
        throw new Error("Failed to upload images.");
      }

      resetFeedbackState(commitPayload.project);
      setStatusMessage(`Variant V${commitPayload.project.latestVersion} added.`);
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
      const imageRouteBase = allowImageManagement
        ? `/api/projects/${project.id}/images`
        : `/api/project/${project.id}/images`;
      const response = await fetch(`${imageRouteBase}/${imageId}`, {
        method: "DELETE",
      });

      const payload = response.ok
        ? ((await response.json().catch(() => null)) as
            | { project?: ProjectFeedbackProject }
            | null)
        : null;

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to delete image."),
        );
      }

      if (!payload?.project) {
        throw new Error("Failed to delete image.");
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
      const imageRouteBase = allowImageManagement
        ? `/api/projects/${project.id}/images`
        : `/api/project/${project.id}/images`;
      const prepareResponse = await fetch(`${imageRouteBase}/${imageId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "prepare-replace",
          file: {
            name: file.name,
            type: file.type,
          },
        }),
      });

      if (!prepareResponse.ok) {
        throw new Error(
          await getResponseErrorMessage(prepareResponse, "Failed to replace image."),
        );
      }

      const preparePayload = (await prepareResponse.json().catch(() => null)) as
        | { signedUrl?: string; publicUrl?: string }
        | null;

      if (!preparePayload?.signedUrl || !preparePayload.publicUrl) {
        throw new Error("Failed to replace image.");
      }

      await uploadFileToSignedUrl({
        signedUrl: preparePayload.signedUrl,
        file,
      });

      const commitResponse = await fetch(`${imageRouteBase}/${imageId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "commit-replace",
          publicUrl: preparePayload.publicUrl,
        }),
      });

      if (!commitResponse.ok) {
        throw new Error(
          await getResponseErrorMessage(commitResponse, "Failed to replace image."),
        );
      }

      const commitPayload = (await commitResponse.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject }
        | null;

      if (!commitPayload?.project) {
        throw new Error("Failed to replace image.");
      }

      resetFeedbackState(commitPayload.project);
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

  const imageStatusRouteBase = allowImageManagement
    ? `/api/projects/${project.id}/images`
    : `/api/project/${project.id}/images`;

  const commentRouteBase = allowImageManagement
    ? `/api/projects/${project.id}/comments`
    : `/api/project/${project.id}/comments`;

  const handleUpdateImageStatus = async (
    imageId: string,
    status: ProjectStatus,
  ) => {
    setBusyImageStatusId(imageId);
    setBusyImageStatus(status);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${imageStatusRouteBase}/${imageId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = response.ok
        ? ((await response.json().catch(() => null)) as
            | { project?: ProjectFeedbackProject }
            | null)
        : null;

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to update image status."),
        );
      }

      if (!payload?.project) {
        throw new Error("Failed to update image status.");
      }

      resetFeedbackState(payload.project);
      setStatusMessage(
        status === "approved"
          ? "Image approved. It remains visible in review and approved images."
          : "Approved state removed. The image now only appears in review.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update image status.",
      );
    } finally {
      setBusyImageStatusId(null);
      setBusyImageStatus(null);
    }
  };

  const handleStartCommentEdit = (comment: ProjectFeedbackComment) => {
    setEditingComment({
      id: comment.id,
      imageId: comment.imageId,
      content: comment.content,
      color: comment.color,
    });
    setActiveCommentId(comment.id);
    setDraft(null);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSaveCommentEdit = async () => {
    if (!editingComment) return;

    setBusyCommentId(editingComment.id);
    setBusyCommentAction("update");
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `${commentRouteBase}/${editingComment.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            content: editingComment.content,
            color: editingComment.color,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to update edit request.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(commentColorStorageKey, editingComment.color);
      }
      setSavedCommentColor(editingComment.color);
      resetFeedbackState(payload.project);
      setStatusMessage("Edit request updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update edit request.",
      );
    } finally {
      setBusyCommentId(null);
      setBusyCommentAction(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm("Delete this edit request?");
    if (!confirmed) return;

    setBusyCommentId(commentId);
    setBusyCommentAction("delete");
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${commentRouteBase}/${commentId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: ProjectFeedbackProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error ?? "Failed to delete edit request.");
      }

      resetFeedbackState(payload.project);
      setStatusMessage("Edit request deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete edit request.",
      );
    } finally {
      setBusyCommentId(null);
      setBusyCommentAction(null);
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
      setIsCopyLinkCopied(true);
      setStatusMessage("Project link copied.");
    } catch (error) {
      setIsCopyLinkCopied(false);
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

  const handleDownloadAllApproved = async () => {
    if (approvedImages.length === 0 || typeof document === "undefined") return;

    setIsDownloadingApproved(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const downloadBase = allowImageManagement
        ? `/api/projects/${project.id}/images`
        : `/api/project/${project.id}/images`;

      for (const { image } of approvedImages) {
        const link = document.createElement("a");
        link.href = `${downloadBase}/${image.id}/download`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }

      setStatusMessage(
        `Started downloading ${approvedImages.length} approved image${
          approvedImages.length === 1 ? "" : "s"
        }.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to download approved images.",
      );
    } finally {
      setIsDownloadingApproved(false);
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
            <h1 className="projectFeedbackTitle">{projectTitle}</h1>
          </div>

          <div className="projectFeedbackActions">
            {showCopyLink ? (
              <button
                className="projectFeedbackAction projectFeedbackActionGhost"
                type="button"
                data-copied={isCopyLinkCopied ? "true" : "false"}
                onClick={() => void handleCopyProjectLink()}
              >
                {isCopyLinkCopied ? "Copied" : "Copy link"}
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
                {isUpdatingStatus ? "Updating..." : "Approve all the project"}
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
          <span>{approvedImageCount} approved</span>
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
          <div className="projectFeedbackWorkspaceTabs" role="tablist" aria-label="Project views">
            <button
              className="projectFeedbackWorkspaceTab"
              type="button"
              role="tab"
              data-active={activeWorkspaceTab === "review" ? "true" : "false"}
              aria-selected={activeWorkspaceTab === "review"}
              onClick={() => setActiveWorkspaceTab("review")}
            >
              In Review
              <span
                data-empty={reviewImageCount === 0 ? "true" : "false"}
                style={reviewImageCount === 0 ? emptyCountBadgeStyle : undefined}
              >
                {reviewImageCount}
              </span>
            </button>
            <button
              className="projectFeedbackWorkspaceTab"
              type="button"
              role="tab"
              data-active={activeWorkspaceTab === "approved" ? "true" : "false"}
              aria-selected={activeWorkspaceTab === "approved"}
              onClick={() => setActiveWorkspaceTab("approved")}
            >
              Approved Images
              <span
                data-empty={approvedImageCount === 0 ? "true" : "false"}
                style={approvedImageCount === 0 ? emptyCountBadgeStyle : undefined}
              >
                {approvedImageCount}
              </span>
            </button>
          </div>

          {activeWorkspaceTab === "review" ? (
            <>
          <div
            className="projectFeedbackVersionTabs"
            role="tablist"
            aria-label="Project variants"
          >
            {reviewVersions.map((versionGroup) => (
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
                  setEditingComment(null);
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
                      isStatusUpdating={busyImageStatusId === image.id}
                      busyActionLabel={
                        busyImageId === image.id && busyImageAction
                          ? busyImageAction === "replace"
                            ? "Replacing..."
                            : "Deleting..."
                          : null
                      }
                      showImageActions={allowImageManagement}
                      showDownloadAction={false}
                      showTeamChat={showTeamChat}
                      allowCommentManagement={allowImageManagement || canInteract}
                      allowImageApproval={canManageApprovedImages}
                      canInteract={canInteract}
                      viewerRole={viewerRole}
                      viewerIdentityLabel={viewerIdentityLabel}
                      viewerEmail={viewerEmail}
                      onApproveImage={(imageId) => {
                        void handleUpdateImageStatus(imageId, "approved");
                      }}
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
                      editingComment={editingComment}
                      busyCommentId={busyCommentId}
                      busyCommentAction={busyCommentAction}
                      onCommentEditStart={handleStartCommentEdit}
                      onCommentEditCancel={() => setEditingComment(null)}
                      onCommentEditChange={setEditingComment}
                      onCommentEditSave={() => void handleSaveCommentEdit()}
                      onCommentDelete={(commentId) => {
                        void handleDeleteComment(commentId);
                      }}
                      onCommentSelect={(commentId) => {
                        setActiveCommentId(commentId);
                        setDraft(null);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="projectFeedbackEmpty">
                <h2 className="projectFeedbackVersionTitle">No images in review</h2>
                <p className="projectFeedbackVersionMeta">
                  All current images are already in approved delivery.
                </p>
              </div>
            )}
          </div>
            </>
          ) : (
            <ProjectFeedbackApprovedGallery
              projectId={project.id}
              approvedImages={approvedImages}
              allowImageManagement={allowImageManagement}
              canManageApprovedImages={canManageApprovedImages}
              isDownloadingAll={isDownloadingApproved}
              busyImageStatusId={busyImageStatusId}
              onDownloadAll={() => void handleDownloadAllApproved()}
              onMoveToReview={(imageId) => {
                void handleUpdateImageStatus(imageId, "in_review");
              }}
            />
          )}
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
  isStatusUpdating: boolean;
  busyActionLabel: string | null;
  showImageActions: boolean;
  showDownloadAction: boolean;
  showTeamChat: boolean;
  allowCommentManagement: boolean;
  allowImageApproval: boolean;
  canInteract: boolean;
  viewerRole: ProjectViewerRole;
  editingComment: EditingComment | null;
  busyCommentId: string | null;
  busyCommentAction: "update" | "delete" | null;
  onApproveImage: (imageId: string) => void;
  onImageClick: (
    image: ProjectFeedbackImage,
    event: MouseEvent<HTMLDivElement>,
  ) => void;
  onDeleteImage: (imageId: string) => void;
  onReplaceImage: (imageId: string, file: File) => void;
  onDraftChange: Dispatch<SetStateAction<DraftComment | null>>;
  onDraftCancel: () => void;
  onDraftSubmit: () => void;
  onCommentEditStart: (comment: ProjectFeedbackComment) => void;
  onCommentEditCancel: () => void;
  onCommentEditChange: Dispatch<SetStateAction<EditingComment | null>>;
  onCommentEditSave: () => void;
  onCommentDelete: (commentId: string) => void;
  onCommentSelect: (commentId: string) => void;
};

type ProjectFeedbackEditRequestsPanelContentProps = {
  image: ProjectFeedbackImage;
  isApprovedImage: boolean;
  activeCommentId: string | null;
  editingCommentForImage: EditingComment | null;
  allowCommentManagement: boolean;
  canInteract: boolean;
  busyCommentId: string | null;
  busyCommentAction: "update" | "delete" | null;
  onCommentSelect: (commentId: string) => void;
  onCommentEditStart: (comment: ProjectFeedbackComment) => void;
  onCommentEditCancel: () => void;
  onCommentEditChange: Dispatch<SetStateAction<EditingComment | null>>;
  onCommentEditSave: () => void;
  onCommentDelete: (commentId: string) => void;
};

function ProjectFeedbackEditRequestsPanelContent({
  image,
  isApprovedImage,
  activeCommentId,
  editingCommentForImage,
  allowCommentManagement,
  canInteract,
  busyCommentId,
  busyCommentAction,
  onCommentSelect,
  onCommentEditStart,
  onCommentEditCancel,
  onCommentEditChange,
  onCommentEditSave,
  onCommentDelete,
}: ProjectFeedbackEditRequestsPanelContentProps) {
  return (
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
              <article
                key={comment.id}
                className="projectFeedbackCommentItem"
                data-active={activeCommentId === comment.id ? "true" : "false"}
                data-editing={editingCommentForImage?.id === comment.id ? "true" : "false"}
                style={{ "--comment-color": comment.color } as CSSProperties}
              >
                <div className="projectFeedbackCommentItemTop">
                  <button
                    className="projectFeedbackCommentMain"
                    type="button"
                    onClick={() => onCommentSelect(comment.id)}
                  >
                    <span className="projectFeedbackCommentIndex">{index + 1}</span>
                    <span className="projectFeedbackCommentBody">
                      <strong>{comment.author}</strong>
                      <span>{comment.content}</span>
                      <span>{formatTimestamp(comment.createdAt)}</span>
                    </span>
                  </button>

                  {allowCommentManagement ? (
                    <div className="projectFeedbackCommentActions">
                      {editingCommentForImage?.id === comment.id ? (
                        <>
                          <button
                            className="projectFeedbackCommentIconButton"
                            type="button"
                            aria-label="Save edit request"
                            title="Save edit request"
                            disabled={
                              busyCommentId === comment.id ||
                              editingCommentForImage.content.trim().length === 0
                            }
                            onClick={() => onCommentEditSave()}
                          >
                            <ProjectFeedbackCheckIcon />
                          </button>
                          <button
                            className="projectFeedbackCommentIconButton"
                            type="button"
                            aria-label="Cancel editing edit request"
                            title="Cancel editing edit request"
                            disabled={busyCommentId === comment.id}
                            onClick={() => onCommentEditCancel()}
                          >
                            <ProjectFeedbackCloseIcon />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="projectFeedbackCommentIconButton"
                            type="button"
                            aria-label="Edit edit request"
                            title="Edit edit request"
                            disabled={busyCommentId === comment.id}
                            onClick={() => onCommentEditStart(comment)}
                          >
                            <ProjectFeedbackEditIcon />
                          </button>
                          <button
                            className="projectFeedbackCommentIconButton projectFeedbackCommentIconButtonDanger"
                            type="button"
                            aria-label="Delete edit request"
                            title="Delete edit request"
                            disabled={busyCommentId === comment.id}
                            onClick={() => onCommentDelete(comment.id)}
                          >
                            <ProjectFeedbackTrashIcon />
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>

                {editingCommentForImage?.id === comment.id ? (
                  <div className="projectFeedbackCommentEditForm">
                    <textarea
                      className="projectFeedbackCommentEditTextarea"
                      value={editingCommentForImage.content}
                      onChange={(event) =>
                        onCommentEditChange((current) =>
                          current?.id === comment.id
                            ? { ...current, content: event.target.value }
                            : current,
                        )
                      }
                      placeholder="Update the edit request"
                      aria-label="Edit request content"
                      required
                    />

                    <div
                      className="projectFeedbackColorOptions"
                      role="group"
                      aria-label="Edit request color"
                    >
                      {commentColorOptions.map((colorOption) => (
                        <button
                          key={colorOption}
                          className="projectFeedbackColorOption"
                          type="button"
                          data-active={
                            editingCommentForImage.color === colorOption ? "true" : "false"
                          }
                          style={{ "--comment-color": colorOption } as CSSProperties}
                          aria-label={`Select color ${colorOption}`}
                          onClick={() =>
                            onCommentEditChange((current) =>
                              current?.id === comment.id
                                ? { ...current, color: colorOption }
                                : current,
                            )
                          }
                        >
                          <span />
                        </button>
                      ))}
                    </div>

                    {busyCommentId === comment.id ? (
                      <p className="projectFeedbackCommentsMeta">
                        {busyCommentAction === "delete"
                          ? "Deleting edit request..."
                          : "Updating edit request..."}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="projectFeedbackCommentsMeta">
          {canInteract
            ? "Click on the image to add the first edit request."
            : isApprovedImage
              ? "Approved images stay visible here as read-only review history."
              : "Visitor mode is view-only for edit requests."}
        </p>
      )}
    </aside>
  );
}

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
  isStatusUpdating,
  busyActionLabel,
  showImageActions,
  showDownloadAction,
  showTeamChat,
  allowCommentManagement,
  allowImageApproval,
  canInteract,
  viewerRole,
  editingComment,
  busyCommentId,
  busyCommentAction,
  onApproveImage,
  onImageClick,
  onDeleteImage,
  onReplaceImage,
  onDraftChange,
  onDraftCancel,
  onDraftSubmit,
  onCommentEditStart,
  onCommentEditCancel,
  onCommentEditChange,
  onCommentEditSave,
  onCommentDelete,
  onCommentSelect,
}: ProjectFeedbackImageCardProps) {
  const isApprovedImage = image.status === "approved";
  const draftForImage = draft?.imageId === image.id ? draft : null;
  const editingCommentForImage =
    editingComment?.imageId === image.id ? editingComment : null;
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [activeSidePanel, setActiveSidePanel] = useState<ImageSidePanelTab>("requests");
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const dimensionsLabel = imageDimensionsLabel(dimensions);
  const hasTeamChat = showTeamChat;
  const canInteractWithImage = canInteract && !isApprovedImage;
  const canManageCommentsForImage = allowCommentManagement && !isApprovedImage;
  const canPost = canInteractWithImage && viewerEmail.length > 0;
  const drawingRouteBase = showImageActions
    ? `/api/projects/${projectId}/images/${image.id}/drawings`
    : `/api/project/${projectId}/images/${image.id}/drawings`;
  const teamChatRouteBase = showImageActions
    ? `/api/projects/${projectId}/images/${image.id}/team-chat`
    : `/api/project/${projectId}/images/${image.id}/team-chat`;
  const [drawingLayer, setDrawingLayer] = useState<ProjectFeedbackDrawingLayer | null>(
    null,
  );
  const [drawingElements, setDrawingElements] = useState<ProjectFeedbackDrawingElement[]>(
    [],
  );
  const [drawingHistory, setDrawingHistory] = useState<
    ProjectFeedbackDrawingElement[][]
  >([]);
  const [drawingFuture, setDrawingFuture] = useState<
    ProjectFeedbackDrawingElement[][]
  >([]);
  const [drawingDraft, setDrawingDraft] = useState<DrawingStrokeDraft | null>(null);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("freehand");
  const [drawingColor, setDrawingColor] = useState(defaultCommentColor);
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(4);
  const [drawingErrorMessage, setDrawingErrorMessage] = useState("");
  const [isLoadingDrawingLayer, setIsLoadingDrawingLayer] = useState(true);
  const [isSavingDrawingLayer, setIsSavingDrawingLayer] = useState(false);
  const downloadHref = `/api/project/${projectId}/images/${image.id}/download`;
  const hasDrawingTab = true;
  const isDrawingInteractionEnabled =
    activeSidePanel === "drawing" && canInteractWithImage && hasDrawingTab;
  const hasDrawingChanges =
    JSON.stringify(drawingLayer?.elements ?? []) !== JSON.stringify(drawingElements);
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

  useEffect(() => {
    let cancelled = false;

    const loadDrawingLayer = async () => {
      setIsLoadingDrawingLayer(true);
      setDrawingErrorMessage("");

      try {
        const response = await fetch(drawingRouteBase, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { layer?: ProjectFeedbackDrawingLayer; error?: string }
          | null;

        if (!response.ok || !payload?.layer) {
          throw new Error(payload?.error ?? "Failed to load drawings.");
        }

        if (cancelled) return;
        setDrawingLayer(payload.layer);
        setDrawingElements(payload.layer.elements);
        setDrawingHistory([]);
        setDrawingFuture([]);
        setDrawingDraft(null);
      } catch (error) {
        if (cancelled) return;
        setDrawingErrorMessage(
          error instanceof Error ? error.message : "Failed to load drawings.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingDrawingLayer(false);
        }
      }
    };

    void loadDrawingLayer();

    return () => {
      cancelled = true;
    };
  }, [drawingRouteBase]);

  useEffect(() => {
    if (hasDrawingTab || activeSidePanel !== "drawing") return;
    setActiveSidePanel("requests");
  }, [activeSidePanel, hasDrawingTab]);

  const commitDrawingElements = (next: ProjectFeedbackDrawingElement[]) => {
    setDrawingHistory((current) => [...current, drawingElements]);
    setDrawingFuture([]);
    setDrawingElements(next);
  };

  const handleEraseDrawing = (point: ProjectFeedbackDrawingPoint) => {
    const nextElements = [...drawingElements];
    for (let index = nextElements.length - 1; index >= 0; index -= 1) {
      if (isPointNearDrawingElement(point, nextElements[index])) {
        nextElements.splice(index, 1);
        commitDrawingElements(nextElements);
        return;
      }
    }
  };

  const handleDrawingPointerDown = (
    event: PointerEvent<SVGSVGElement>,
  ) => {
    if (!isDrawingInteractionEnabled) return;

    event.preventDefault();
    event.stopPropagation();

    const point = getDrawingPointFromEvent(event);

    if (drawingTool === "eraser") {
      handleEraseDrawing(point);
      return;
    }

    const nextTool = drawingTool as ShapeDrawingTool;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    if (nextTool === "freehand") {
      setDrawingDraft({
        type: "freehand",
        color: drawingColor,
        strokeWidth: drawingStrokeWidth,
        points: [point],
      });
      return;
    }

    setDrawingDraft({
      type: nextTool,
      color: drawingColor,
      strokeWidth: drawingStrokeWidth,
      start: point,
      end: point,
    });
  };

  const handleDrawingPointerMove = (
    event: PointerEvent<SVGSVGElement>,
  ) => {
    if (!drawingDraft) return;

    const point = getDrawingPointFromEvent(event);
    setDrawingDraft((current) => {
      if (!current) return current;

      if (current.type === "freehand") {
        return {
          ...current,
          points: [...current.points, point],
        };
      }

      return {
        ...current,
        end: point,
      };
    });
  };

  const handleDrawingPointerUp = (
    event: PointerEvent<SVGSVGElement>,
  ) => {
    if (!drawingDraft) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const nextElement = createDrawingElementFromDraft(drawingDraft);
    setDrawingDraft(null);

    if (!nextElement) return;
    commitDrawingElements([...drawingElements, nextElement]);
  };

  const handleUndoDrawing = () => {
    const previousElements = drawingHistory[drawingHistory.length - 1];
    if (!previousElements) return;

    setDrawingHistory((current) => current.slice(0, -1));
    setDrawingFuture((current) => [...current, drawingElements]);
    setDrawingElements(previousElements);
    setDrawingDraft(null);
  };

  const handleRedoDrawing = () => {
    const nextElements = drawingFuture[drawingFuture.length - 1];
    if (!nextElements) return;

    setDrawingFuture((current) => current.slice(0, -1));
    setDrawingHistory((current) => [...current, drawingElements]);
    setDrawingElements(nextElements);
    setDrawingDraft(null);
  };

  const handleResetDrawingChanges = () => {
    setDrawingElements(drawingLayer?.elements ?? []);
    setDrawingHistory([]);
    setDrawingFuture([]);
    setDrawingDraft(null);
    setDrawingErrorMessage("");
  };

  const handleSaveDrawingLayer = async () => {
    if (!canInteractWithImage) return;

    setIsSavingDrawingLayer(true);
    setDrawingErrorMessage("");

    try {
      const response = await fetch(drawingRouteBase, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          viewerEmail,
          elements: drawingElements,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { layer?: ProjectFeedbackDrawingLayer; error?: string }
        | null;

      if (!response.ok || !payload?.layer) {
        throw new Error(payload?.error ?? "Failed to save drawings.");
      }

      setDrawingLayer(payload.layer);
      setDrawingElements(payload.layer.elements);
      setDrawingHistory([]);
      setDrawingFuture([]);
      setDrawingDraft(null);
    } catch (error) {
      setDrawingErrorMessage(
        error instanceof Error ? error.message : "Failed to save drawings.",
      );
    } finally {
      setIsSavingDrawingLayer(false);
    }
  };

  return (
    <article
      className="projectFeedbackImageCard"
      data-team-chat={hasTeamChat ? "true" : "false"}
      data-can-interact={canInteractWithImage ? "true" : "false"}
      data-approved={isApprovedImage ? "true" : "false"}
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

        {showImageActions || showDownloadAction || allowImageApproval ? (
          <div className="projectFeedbackImageActions">
            {allowImageApproval ? (
              <button
                className="projectFeedbackMiniAction projectFeedbackMiniActionApprove"
                type="button"
                disabled={isStatusUpdating || isApprovedImage}
                onClick={() => onApproveImage(image.id)}
              >
                {isStatusUpdating
                  ? "Approving..."
                  : isApprovedImage
                    ? "Approved"
                    : "Approve image"}
              </button>
            ) : null}
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
        data-interactive={canInteractWithImage ? "true" : "false"}
        data-approved={isApprovedImage ? "true" : "false"}
        onClick={(event) => {
          if (isBusy || !canInteractWithImage || isDrawingInteractionEnabled) return;
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

        {isApprovedImage ? (
          <div className="projectFeedbackApprovalWatermark" aria-hidden="true">
            <span>Approved</span>
          </div>
        ) : null}

        {hasDrawingTab ? (
          <ProjectFeedbackDrawingCanvas
            elements={drawingElements}
            draft={drawingDraft}
            interactive={isDrawingInteractionEnabled}
            onPointerDown={handleDrawingPointerDown}
            onPointerMove={handleDrawingPointerMove}
            onPointerUp={handleDrawingPointerUp}
          />
        ) : null}

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
              {!canInteractWithImage
                ? isApprovedImage
                  ? "Approved images stay visible here as read-only review history."
                  : "Visitor mode is read-only for edit requests."
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

      <div className="projectFeedbackDesktopSidePanel">
        <div className="projectFeedbackSidePanelTabs" role="tablist" aria-label="Image panels">
          <button
            className="projectFeedbackSidePanelTab"
            type="button"
            role="tab"
            data-active={activeSidePanel === "requests" ? "true" : "false"}
            aria-selected={activeSidePanel === "requests"}
            onClick={() => setActiveSidePanel("requests")}
          >
            Edit Requests
            <span
              data-empty={image.comments.length === 0 ? "true" : "false"}
              style={image.comments.length === 0 ? emptyCountBadgeStyle : undefined}
            >
              {image.comments.length}
            </span>
          </button>
          {hasTeamChat ? (
            <button
              className="projectFeedbackSidePanelTab"
              type="button"
              role="tab"
              data-active={activeSidePanel === "chat" ? "true" : "false"}
              aria-selected={activeSidePanel === "chat"}
              onClick={() => setActiveSidePanel("chat")}
            >
              Team Chat
            </button>
          ) : null}
          {hasDrawingTab ? (
            <button
              className="projectFeedbackSidePanelTab"
              type="button"
              role="tab"
              data-active={activeSidePanel === "drawing" ? "true" : "false"}
              aria-selected={activeSidePanel === "drawing"}
              onClick={() => setActiveSidePanel("drawing")}
            >
              Dessin
              <span
                data-empty={drawingElements.length === 0 ? "true" : "false"}
                style={drawingElements.length === 0 ? emptyCountBadgeStyle : undefined}
              >
                {drawingElements.length}
              </span>
            </button>
          ) : null}
        </div>

        <div className="projectFeedbackSidePanelBody">
          <div hidden={activeSidePanel !== "requests"}>
            <ProjectFeedbackEditRequestsPanelContent
              image={image}
              isApprovedImage={isApprovedImage}
              activeCommentId={activeCommentId}
              editingCommentForImage={editingCommentForImage}
              allowCommentManagement={canManageCommentsForImage}
              canInteract={canInteractWithImage}
              busyCommentId={busyCommentId}
              busyCommentAction={busyCommentAction}
              onCommentSelect={onCommentSelect}
              onCommentEditStart={onCommentEditStart}
              onCommentEditCancel={onCommentEditCancel}
              onCommentEditChange={onCommentEditChange}
              onCommentEditSave={onCommentEditSave}
              onCommentDelete={onCommentDelete}
            />
          </div>

          {hasTeamChat && activeSidePanel === "chat" ? (
            <div>
              <ProjectFeedbackTeamChat
                teamChatRouteBase={teamChatRouteBase}
                viewerEmail={viewerEmail}
                viewerIdentityLabel={viewerIdentityLabel}
                isApprovedImage={isApprovedImage}
                canInteract={canInteractWithImage}
                viewerRole={viewerRole}
                detailsMode={false}
              />
            </div>
          ) : null}

          {hasDrawingTab && activeSidePanel === "drawing" ? (
            <div>
              <ProjectFeedbackDrawingPanelContent
                isLoading={isLoadingDrawingLayer}
                isSaving={isSavingDrawingLayer}
                canInteract={canInteractWithImage}
                isApprovedImage={isApprovedImage}
                viewerIdentityLabel={viewerIdentityLabel}
                viewerRole={viewerRole}
                selectedTool={drawingTool}
                selectedColor={drawingColor}
                selectedStrokeWidth={drawingStrokeWidth}
                drawingCount={drawingElements.length}
                hasChanges={hasDrawingChanges}
                canUndo={drawingHistory.length > 0}
                canRedo={drawingFuture.length > 0}
                updatedBy={drawingLayer?.updatedBy ?? null}
                updatedAt={drawingLayer?.updatedAt ?? null}
                errorMessage={drawingErrorMessage}
                onSelectTool={setDrawingTool}
                onSelectColor={setDrawingColor}
                onSelectStrokeWidth={setDrawingStrokeWidth}
                onUndo={handleUndoDrawing}
                onRedo={handleRedoDrawing}
                onReset={handleResetDrawingChanges}
                onSave={() => void handleSaveDrawingLayer()}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="projectFeedbackMobilePanels">
        <details className="projectFeedbackSectionPanel projectFeedbackCommentsPanel">
          <summary className="projectFeedbackSectionSummary">
            <span className="projectFeedbackCommentsTitle">Edit Requests</span>
            <span
              className="projectFeedbackCommentsMeta"
              data-empty={findImageCommentCount(image) === 0 ? "true" : "false"}
              style={
                findImageCommentCount(image) === 0 ? emptyCountBadgeStyle : undefined
              }
            >
              {editRequestCountLabel(findImageCommentCount(image))}
            </span>
          </summary>

          <ProjectFeedbackEditRequestsPanelContent
            image={image}
            isApprovedImage={isApprovedImage}
            activeCommentId={activeCommentId}
            editingCommentForImage={editingCommentForImage}
            allowCommentManagement={canManageCommentsForImage}
            canInteract={canInteractWithImage}
            busyCommentId={busyCommentId}
            busyCommentAction={busyCommentAction}
            onCommentSelect={onCommentSelect}
            onCommentEditStart={onCommentEditStart}
            onCommentEditCancel={onCommentEditCancel}
            onCommentEditChange={onCommentEditChange}
            onCommentEditSave={onCommentEditSave}
            onCommentDelete={onCommentDelete}
          />
        </details>

        {hasTeamChat ? (
          <ProjectFeedbackTeamChat
            teamChatRouteBase={teamChatRouteBase}
            viewerEmail={viewerEmail}
            viewerIdentityLabel={viewerIdentityLabel}
            isApprovedImage={isApprovedImage}
            canInteract={canInteractWithImage}
            viewerRole={viewerRole}
            detailsMode
          />
        ) : null}

        {hasDrawingTab ? (
          <details className="projectFeedbackSectionPanel projectFeedbackDrawingSection">
            <summary className="projectFeedbackSectionSummary">
              <span className="projectFeedbackCommentsTitle">Dessin</span>
              <span
                className="projectFeedbackCommentsMeta"
                data-empty={drawingElements.length === 0 ? "true" : "false"}
                style={
                  drawingElements.length === 0 ? emptyCountBadgeStyle : undefined
                }
              >
                {drawingElements.length} item{drawingElements.length === 1 ? "" : "s"}
              </span>
            </summary>

            <ProjectFeedbackDrawingPanelContent
              isLoading={isLoadingDrawingLayer}
              isSaving={isSavingDrawingLayer}
              canInteract={canInteractWithImage}
              isApprovedImage={isApprovedImage}
              viewerIdentityLabel={viewerIdentityLabel}
              viewerRole={viewerRole}
              selectedTool={drawingTool}
              selectedColor={drawingColor}
              selectedStrokeWidth={drawingStrokeWidth}
              drawingCount={drawingElements.length}
              hasChanges={hasDrawingChanges}
              canUndo={drawingHistory.length > 0}
              canRedo={drawingFuture.length > 0}
              updatedBy={drawingLayer?.updatedBy ?? null}
              updatedAt={drawingLayer?.updatedAt ?? null}
              errorMessage={drawingErrorMessage}
              onSelectTool={setDrawingTool}
              onSelectColor={setDrawingColor}
              onSelectStrokeWidth={setDrawingStrokeWidth}
              onUndo={handleUndoDrawing}
              onRedo={handleRedoDrawing}
              onReset={handleResetDrawingChanges}
              onSave={() => void handleSaveDrawingLayer()}
            />
          </details>
        ) : null}
      </div>
    </article>
  );
}

type ProjectFeedbackApprovedGalleryProps = {
  projectId: string;
  approvedImages: Array<{
    image: ProjectFeedbackImage;
    imageLabel: string;
    version: number;
  }>;
  allowImageManagement: boolean;
  canManageApprovedImages: boolean;
  isDownloadingAll: boolean;
  busyImageStatusId: string | null;
  onDownloadAll: () => void;
  onMoveToReview: (imageId: string) => void;
};

type ProjectFeedbackDrawingCanvasProps = {
  elements: ProjectFeedbackDrawingElement[];
  draft: DrawingStrokeDraft | null;
  interactive: boolean;
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
};

type ProjectFeedbackDrawingPanelContentProps = {
  isLoading: boolean;
  isSaving: boolean;
  canInteract: boolean;
  isApprovedImage: boolean;
  viewerIdentityLabel: string;
  viewerRole: ProjectViewerRole;
  selectedTool: DrawingTool;
  selectedColor: string;
  selectedStrokeWidth: number;
  drawingCount: number;
  hasChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
  errorMessage: string;
  onSelectTool: Dispatch<SetStateAction<DrawingTool>>;
  onSelectColor: Dispatch<SetStateAction<string>>;
  onSelectStrokeWidth: Dispatch<SetStateAction<number>>;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSave: () => void;
};

function ProjectFeedbackDrawingShape({
  element,
}: {
  element: ProjectFeedbackDrawingElement;
}) {
  const commonShapeProps = {
    fill: "none",
    stroke: element.color,
    strokeWidth: element.strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };

  if (element.type === "freehand") {
    return (
      <polyline
        points={element.points
          .map((point) => `${getSvgCoordinateValue(point.x)},${getSvgCoordinateValue(point.y)}`)
          .join(" ")}
        {...commonShapeProps}
      />
    );
  }

  if (element.type === "line") {
    return (
      <line
        x1={getSvgCoordinateValue(element.start.x)}
        y1={getSvgCoordinateValue(element.start.y)}
        x2={getSvgCoordinateValue(element.end.x)}
        y2={getSvgCoordinateValue(element.end.y)}
        {...commonShapeProps}
      />
    );
  }

  if (element.type === "rectangle") {
    const minX = Math.min(element.start.x, element.end.x);
    const minY = Math.min(element.start.y, element.end.y);
    const width = Math.abs(element.end.x - element.start.x);
    const height = Math.abs(element.end.y - element.start.y);

    return (
      <rect
        x={getSvgCoordinateValue(minX)}
        y={getSvgCoordinateValue(minY)}
        width={Math.max(getSvgCoordinateValue(width), 1)}
        height={Math.max(getSvgCoordinateValue(height), 1)}
        {...commonShapeProps}
      />
    );
  }

  const centerX = (element.start.x + element.end.x) / 2;
  const centerY = (element.start.y + element.end.y) / 2;
  const radiusX = Math.abs(element.end.x - element.start.x) / 2;
  const radiusY = Math.abs(element.end.y - element.start.y) / 2;

  return (
    <ellipse
      cx={getSvgCoordinateValue(centerX)}
      cy={getSvgCoordinateValue(centerY)}
      rx={Math.max(getSvgCoordinateValue(radiusX), 1)}
      ry={Math.max(getSvgCoordinateValue(radiusY), 1)}
      {...commonShapeProps}
    />
  );
}

function ProjectFeedbackDrawingCanvas({
  elements,
  draft,
  interactive,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ProjectFeedbackDrawingCanvasProps) {
  const draftElement = draft ? createDrawingElementFromDraft(draft) : null;

  return (
    <svg
      className="projectFeedbackDrawingCanvas"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      data-interactive={interactive ? "true" : "false"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {elements.map((element) => (
        <ProjectFeedbackDrawingShape key={element.id} element={element} />
      ))}

      {draftElement ? <ProjectFeedbackDrawingShape element={draftElement} /> : null}
    </svg>
  );
}

function ProjectFeedbackDrawingPanelContent({
  isLoading,
  isSaving,
  canInteract,
  isApprovedImage,
  viewerIdentityLabel,
  viewerRole,
  selectedTool,
  selectedColor,
  selectedStrokeWidth,
  drawingCount,
  hasChanges,
  canUndo,
  canRedo,
  updatedBy,
  updatedAt,
  errorMessage,
  onSelectTool,
  onSelectColor,
  onSelectStrokeWidth,
  onUndo,
  onRedo,
  onReset,
  onSave,
}: ProjectFeedbackDrawingPanelContentProps) {
  const toolOptions: Array<{ value: DrawingTool; label: string }> = [
    { value: "freehand", label: "Freehand" },
    { value: "line", label: "Line" },
    { value: "rectangle", label: "Rectangle" },
    { value: "circle", label: "Circle" },
    { value: "eraser", label: "Eraser" },
  ];

  return (
    <aside className="projectFeedbackDrawing">
      <div className="projectFeedbackCommentsHeader">
        <h3 className="projectFeedbackCommentsTitle">Dessin</h3>
        <div className="projectFeedbackCommentsMetaGroup">
          <p className="projectFeedbackCommentsMeta">
            {drawingCount} shape{drawingCount === 1 ? "" : "s"}
          </p>
          {updatedAt ? (
            <p className="projectFeedbackCommentsMeta">
              {updatedBy ? `${updatedBy} · ` : ""}
              {formatTimestamp(updatedAt)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="projectFeedbackDrawingPanel">
        {isLoading ? (
          <p className="projectFeedbackCommentsMeta">Loading drawing layer...</p>
        ) : (
          <>
            {canInteract ? (
              <>
                <div className="projectFeedbackDrawingTools">
                  {toolOptions.map((toolOption) => (
                    <button
                      key={toolOption.value}
                      className="projectFeedbackDrawingToolButton"
                      type="button"
                      data-active={selectedTool === toolOption.value ? "true" : "false"}
                      disabled={!canInteract}
                      onClick={() => onSelectTool(toolOption.value)}
                    >
                      {toolOption.label}
                    </button>
                  ))}
                </div>

                <div className="projectFeedbackDrawingControls">
                  <div className="projectFeedbackField">
                    <span>Color</span>
                    <div className="projectFeedbackColorOptions" role="group" aria-label="Drawing color">
                      {commentColorOptions.map((colorOption) => (
                        <button
                          key={colorOption}
                          className="projectFeedbackColorOption"
                          type="button"
                          data-active={selectedColor === colorOption ? "true" : "false"}
                          style={{ "--comment-color": colorOption } as CSSProperties}
                          disabled={!canInteract}
                          onClick={() => onSelectColor(colorOption)}
                        >
                          <span />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="projectFeedbackField">
                    <span>Stroke</span>
                    <div className="projectFeedbackDrawingStrokeOptions">
                      {drawingStrokeWidths.map((strokeWidth) => (
                        <button
                          key={strokeWidth}
                          className="projectFeedbackDrawingStrokeButton"
                          type="button"
                          data-active={selectedStrokeWidth === strokeWidth ? "true" : "false"}
                          disabled={!canInteract}
                          onClick={() => onSelectStrokeWidth(strokeWidth)}
                        >
                          {strokeWidth}px
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="projectFeedbackDrawingActionRow">
                  <button
                    className="projectFeedbackMiniAction"
                    type="button"
                    disabled={!canInteract || !canUndo}
                    onClick={onUndo}
                  >
                    Undo
                  </button>
                  <button
                    className="projectFeedbackMiniAction"
                    type="button"
                    disabled={!canInteract || !canRedo}
                    onClick={onRedo}
                  >
                    Redo
                  </button>
                  <button
                    className="projectFeedbackMiniAction projectFeedbackMiniActionGhost"
                    type="button"
                    disabled={!canInteract || !hasChanges}
                    onClick={onReset}
                  >
                    Reset
                  </button>
                  <button
                    className="projectFeedbackMiniAction projectFeedbackMiniActionApprove"
                    type="button"
                    disabled={!canInteract || !hasChanges || isSaving}
                    onClick={onSave}
                  >
                    {isSaving ? "Saving..." : "Save layer"}
                  </button>
                </div>
              </>
            ) : null}

            {!canInteract ? (
              <p className="projectFeedbackCommentsMeta">
                {isApprovedImage
                  ? "Approved images keep the drawing layer visible in read-only mode."
                  : viewerRole === "visitor"
                    ? "Visitor mode is view-only for drawings."
                    : "Open the project as a team member to edit drawings."}
              </p>
            ) : (
              <p className="projectFeedbackCommentsMeta">
                {viewerIdentityLabel
                  ? `Editing as ${viewerIdentityLabel}`
                  : "Draw directly on the image, then save the layer."}
              </p>
            )}

            {errorMessage ? (
              <p className="projectFeedbackMessage projectFeedbackMessageError">
                {errorMessage}
              </p>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}

type ProjectFeedbackApprovedCardProps = {
  image: ProjectFeedbackImage;
  imageLabel: string;
  version: number;
  downloadBase: string;
  canManageApprovedImages: boolean;
  busyImageStatusId: string | null;
  onMoveToReview: (imageId: string) => void;
};

function ProjectFeedbackApprovedCard({
  image,
  imageLabel,
  version,
  downloadBase,
  canManageApprovedImages,
  busyImageStatusId,
  onMoveToReview,
}: ProjectFeedbackApprovedCardProps) {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const dimensionsLabel = imageDimensionsLabel(dimensions);

  return (
    <article className="projectFeedbackApprovedCard">
      <div className="projectFeedbackApprovedCardHeader">
        <div className="projectFeedbackImageCardCopy">
          <h3 className="projectFeedbackImageTitle">
            <span className="projectFeedbackImageTitleLabel">{imageLabel}</span>
            {dimensionsLabel ? (
              <span className="projectFeedbackImageTitleDimensions">
                - {dimensionsLabel}
              </span>
            ) : null}
          </h3>
          <p className="projectFeedbackImageMeta">{`Variant V${version}`}</p>
        </div>

        <span className="projectFeedbackApprovedBadge">Approved</span>
      </div>

      <div className="projectFeedbackApprovedMedia">
        <img
          className="projectFeedbackImage"
          src={image.url}
          alt={`${imageLabel} from variant V${version}`}
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
      </div>

      <div className="projectFeedbackApprovedActions">
        <a
          className="projectFeedbackMiniAction"
          href={`${downloadBase}/${image.id}/download`}
        >
          Download image
        </a>

        {canManageApprovedImages ? (
          <button
            className="projectFeedbackMiniAction projectFeedbackMiniActionGhost"
            type="button"
            disabled={busyImageStatusId === image.id}
            onClick={() => onMoveToReview(image.id)}
          >
            {busyImageStatusId === image.id ? "Updating..." : "Remove approved state"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function ProjectFeedbackApprovedGallery({
  projectId,
  approvedImages,
  allowImageManagement,
  canManageApprovedImages,
  isDownloadingAll,
  busyImageStatusId,
  onDownloadAll,
  onMoveToReview,
}: ProjectFeedbackApprovedGalleryProps) {
  const downloadBase = allowImageManagement
    ? `/api/projects/${projectId}/images`
    : `/api/project/${projectId}/images`;

  if (approvedImages.length === 0) {
    return (
      <div className="projectFeedbackEmpty">
        <h2 className="projectFeedbackVersionTitle">No approved images yet</h2>
        <p className="projectFeedbackVersionMeta">
          Approved images will move here automatically.
        </p>
      </div>
    );
  }

  return (
    <section className="projectFeedbackApprovedShell">
      <div className="projectFeedbackApprovedHeader">
        <div className="projectFeedbackCommentsHeader">
          <h2 className="projectFeedbackCommentsTitle">Approved Images</h2>
          <div className="projectFeedbackCommentsMetaGroup">
            <p className="projectFeedbackCommentsMeta">
              {approvedImages.length} approved image{approvedImages.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <button
          className="projectFeedbackAction projectFeedbackActionGhost"
          type="button"
          disabled={isDownloadingAll}
          onClick={onDownloadAll}
        >
          {isDownloadingAll ? "Preparing..." : "Download all"}
        </button>
      </div>

      <div className="projectFeedbackApprovedGrid">
        {approvedImages.map(({ image, imageLabel, version }) => (
          <ProjectFeedbackApprovedCard
            key={image.id}
            image={image}
            imageLabel={imageLabel}
            version={version}
            downloadBase={downloadBase}
            canManageApprovedImages={canManageApprovedImages}
            busyImageStatusId={busyImageStatusId}
            onMoveToReview={onMoveToReview}
          />
        ))}
      </div>
    </section>
  );
}

function ProjectFeedbackEditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 20h4l10-10-4-4L4 16v4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12 6l4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ProjectFeedbackTrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 7h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 7V5h6v2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M7 7l1 12h8l1-12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 11v5M14 11v5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ProjectFeedbackCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m5 13 4 4L19 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function ProjectFeedbackCloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7l10 10M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function ProjectFeedbackSendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 12h12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
      <path
        d="m12 6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

type ProjectFeedbackTeamChatProps = {
  teamChatRouteBase: string;
  viewerEmail: string;
  viewerIdentityLabel: string;
  isApprovedImage: boolean;
  canInteract: boolean;
  viewerRole: ProjectViewerRole;
  detailsMode?: boolean;
};

function ProjectFeedbackTeamChat({
  teamChatRouteBase,
  viewerEmail,
  viewerIdentityLabel,
  isApprovedImage,
  canInteract,
  viewerRole,
  detailsMode = true,
}: ProjectFeedbackTeamChatProps) {
  const [messages, setMessages] = useState<ProjectFeedbackTeamMessage[]>([]);
  const [content, setContent] = useState("");
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const canPost = canInteract && viewerEmail.length > 0;
  const replyTarget =
    messages.find((message) => message.id === replyTargetId) ?? null;
  const placeholderTarget = "Anything to say ?";

  useEffect(() => {
    let cancelled = false;
    let isForbidden = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadMessages = async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setIsLoading(true);
      }

      if (!silent) {
        setErrorMessage("");
      }

      try {
        const response = await fetch(teamChatRouteBase, {
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | { messages?: ProjectFeedbackTeamMessage[]; error?: string }
          | null;

        if (response.status === 403) {
          isForbidden = true;
          if (!cancelled && !silent) {
            setErrorMessage(
              payload?.error ?? "Open the project with your email to view the team chat.",
            );
          }
          return;
        }

        if (!response.ok || !payload?.messages) {
          throw new Error(payload?.error ?? "Failed to load team chat.");
        }

        if (!cancelled) {
          setMessages(payload.messages);
          if (!silent) {
            setErrorMessage("");
          }
        }
      } catch (error) {
        if (!cancelled && !silent) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load team chat.",
          );
        }
      } finally {
        if (!cancelled && !silent) {
          setIsLoading(false);
        }
      }
    };

    void loadMessages();

    intervalId = setInterval(() => {
      if (isForbidden) {
        return;
      }
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      void loadMessages({ silent: true });
    }, teamChatPollIntervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadMessages({ silent: true });
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [teamChatRouteBase]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (!canPost) {
      setAnimatedPlaceholder(
        isApprovedImage
          ? "Approved chat history"
          : "Open the project with your email to chat",
      );
      return;
    }

    let frame = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      const cycle = placeholderTarget.length + 18;
      const position = frame % cycle;
      const sliceLength =
        position <= placeholderTarget.length ? position : placeholderTarget.length;

      setAnimatedPlaceholder(placeholderTarget.slice(0, sliceLength));
      frame += 1;
      timeoutId = setTimeout(tick, position < placeholderTarget.length ? 65 : 95);
    };

    tick();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [canPost, isApprovedImage]);

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || !canPost) return;

    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await fetch(teamChatRouteBase, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          viewerEmail,
          content: trimmedContent,
          replyToMessageId: replyTargetId,
        }),
      });

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

  const teamChatContent = (
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
                const bubblePalette = getTeamChatBubblePalette(message.author);

                return (
                  <article
                    key={message.id}
                    className="projectFeedbackTeamChatMessage"
                    data-mine={isMine ? "true" : "false"}
                    style={
                      {
                        "--chat-bubble-background": bubblePalette.background,
                        "--chat-bubble-border": bubblePalette.border,
                        "--chat-bubble-accent": bubblePalette.accent,
                      } as CSSProperties
                    }
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

          {!canInteract ? (
            <p className="projectFeedbackCommentsMeta">
              {isApprovedImage
                ? "Approved images keep the team chat history visible in read-only mode."
                : viewerRole === "visitor"
                ? "Visitor mode is read-only for team chat."
                : "Team member access is required to join the team chat."}
            </p>
          ) : null}

          <label className="projectFeedbackField projectFeedbackTeamChatField">
            <textarea
              className="projectFeedbackTextarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={animatedPlaceholder}
              aria-label="Message"
              required
              disabled={!canPost || isSending}
            />
          </label>

          <div className="projectFeedbackDraftActions">
            <button
              className="projectFeedbackChatSendButton"
              type="submit"
              aria-label={isSending ? "Sending message" : "Send message"}
              disabled={isSending || !canPost}
            >
              {isSending ? "..." : <ProjectFeedbackSendIcon />}
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

  if (!detailsMode) {
    return teamChatContent;
  }

  return (
    <details className="projectFeedbackSectionPanel projectFeedbackChatPanel">
      <summary className="projectFeedbackSectionSummary">
        <span className="projectFeedbackCommentsTitle">Team Chat</span>
        <span
          className="projectFeedbackCommentsMeta"
          data-empty={messages.length === 0 ? "true" : "false"}
          style={messages.length === 0 ? emptyCountBadgeStyle : undefined}
        >
          {teamMessageCountLabel(messages.length)}
        </span>
      </summary>

      {teamChatContent}
    </details>
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
