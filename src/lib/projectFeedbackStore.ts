import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getProjectViewerCookieName,
  getProjectViewerRoleCookieName,
  maskProjectViewerEmail,
  normalizeProjectViewerEmail,
  normalizeProjectViewerRole,
} from "@/lib/projectViewerIdentity";
import type {
  ProjectFeedbackComment,
  ProjectFeedbackImage,
  ProjectFeedbackProject,
  ProjectFeedbackTeamMessage,
  ProjectStatus,
  ProjectSummary,
  ProjectVersionGroup,
} from "@/lib/projectFeedbackTypes";

const PROJECT_IMAGE_BUCKET = "project-images";
const PROJECT_ASSET_BROWSER_CACHE_TTL_SECONDS = "31536000";
const DEFAULT_COMMENT_COLOR = "#d88fa2";

type ProjectRow = {
  id: string;
  name: string;
  status: string | null;
  access_password?: string | null;
  created_at: string;
};

type ImageRow = {
  id: string;
  project_id: string;
  project_name?: string | null;
  url: string;
  status?: string | null;
  version: number;
  created_at: string;
};

type CommentRow = {
  id: string;
  project_id: string;
  image_id: string;
  x: number;
  y: number;
  color?: string | null;
  author: string | null;
  content: string;
  created_at: string;
};

type ProjectViewerRow = {
  id: string;
  project_id: string;
  email: string;
  created_at: string;
  last_seen_at: string;
};

type TeamMessageRow = {
  id: string;
  project_id: string;
  image_id: string;
  reply_to_id?: string | null;
  author: string | null;
  content: string;
  created_at: string;
};

type ProjectImageDownloadAsset = {
  filename: string;
  url: string;
};

const IMAGE_SELECT_WITH_STATUS = "id, project_id, url, status, version, created_at";
const IMAGE_SELECT_WITHOUT_STATUS = "id, project_id, url, version, created_at";
const IMAGE_DOWNLOAD_SELECT_WITH_STATUS = "id, url, status, version";
const IMAGE_DOWNLOAD_SELECT_WITHOUT_STATUS = "id, url, version";

function normalizeStatus(status: string | null | undefined): ProjectStatus {
  return status === "approved" ? "approved" : "in_review";
}

function normalizeImageStatus(status: string | null | undefined): ProjectStatus {
  return status === "approved" ? "approved" : "in_review";
}

function normalizeAccessPassword(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeEmail(value: string) {
  return normalizeProjectViewerEmail(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeCommentColor(value: string | null | undefined) {
  const color = value?.trim().toLowerCase() ?? "";
  return /^#[0-9a-f]{6}$/.test(color) ? color : DEFAULT_COMMENT_COLOR;
}

function isMissingImageStatusColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  const code = typeof candidate.code === "string" ? candidate.code.trim() : "";
  const combined = [candidate.message, candidate.details, candidate.hint]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();

  return (
    (code === "42703" && combined.includes("status")) ||
    combined.includes("column images.status does not exist") ||
    combined.includes("column \"status\" does not exist")
  );
}

function buildImageStatusMigrationError() {
  return new Error(
    "Run the latest myStudio image-status SQL migration before approving images.",
  );
}

function sanitizeFilename(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image"
  );
}

function extensionFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").pop() ?? "";
    const dotIndex = lastSegment.lastIndexOf(".");
    return dotIndex >= 0 ? lastSegment.slice(dotIndex) : ".jpg";
  } catch {
    return ".jpg";
  }
}

function extensionForFile(file: File) {
  const nameParts = file.name.split(".");
  const maybeExtension = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : "";
  if (maybeExtension) return `.${maybeExtension}`;

  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  if (file.type === "image/svg+xml") return ".svg";
  return ".jpg";
}

function createImagePath(projectId: string, version: number, file: File) {
  const extension = extensionForFile(file);
  const baseName = sanitizeFilename(file.name.replace(/\.[^.]+$/, ""));
  return `${projectId}/v${version}/${crypto.randomUUID()}-${baseName}${extension}`;
}

export function getProjectAccessCookieName(projectId: string) {
  return `bs_myproject_access_${projectId}`;
}

export { getProjectViewerCookieName, getProjectViewerRoleCookieName };

function getStoragePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${PROJECT_IMAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length).split("?")[0] ?? "");
}

function buildTeamMessagePayload(
  message: TeamMessageRow,
  replySource: TeamMessageRow | null,
): ProjectFeedbackTeamMessage {
  return {
    id: message.id,
    projectId: message.project_id,
    imageId: message.image_id,
    author: message.author?.trim() || "Team",
    content: message.content,
    createdAt: message.created_at,
    replyToMessageId: message.reply_to_id ?? null,
    replyToAuthor: replySource?.author?.trim() || null,
    replyToContent: replySource?.content ?? null,
  };
}

async function resolveProjectViewerAuthor(projectId: string, viewerEmail: string) {
  const email = normalizeEmail(viewerEmail);
  if (!isValidEmail(email)) {
    throw new Error("Open the project with your email before posting.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("project_viewers")
    .select("email")
    .eq("project_id", projectId)
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Open the project with your email before posting.");
  }

  return maskProjectViewerEmail(email);
}

export async function isRegisteredProjectViewer(
  projectId: string,
  viewerEmail: string | null | undefined,
) {
  const email = normalizeEmail(viewerEmail ?? "");
  if (!isValidEmail(email)) return false;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("project_viewers")
    .select("id")
    .eq("project_id", projectId)
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function canProjectViewerRead(
  projectId: string,
  viewerEmail: string | null | undefined,
) {
  return isRegisteredProjectViewer(projectId, viewerEmail);
}

export async function canProjectViewerInteract(input: {
  projectId: string;
  password: string | null | undefined;
  viewerRole: string | null | undefined;
  viewerEmail: string | null | undefined;
}) {
  const role = normalizeProjectViewerRole(input.viewerRole);
  if (role !== "team") return false;

  const hasViewerAccess = await isRegisteredProjectViewer(
    input.projectId,
    input.viewerEmail,
  );
  if (!hasViewerAccess) return false;

  return isProjectAccessAuthorized(input.projectId, input.password);
}

function buildProjectPayload(
  project: ProjectRow,
  images: ImageRow[],
  comments: CommentRow[],
  viewers: ProjectViewerRow[],
): ProjectFeedbackProject {
  const commentsByImageId = new Map<string, ProjectFeedbackComment[]>();

  for (const comment of [...comments].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  )) {
    const list = commentsByImageId.get(comment.image_id) ?? [];
    list.push({
      id: comment.id,
      projectId: comment.project_id,
      imageId: comment.image_id,
      x: Math.min(Math.max(comment.x, 0), 1),
      y: Math.min(Math.max(comment.y, 0), 1),
      color: normalizeCommentColor(comment.color),
      author: comment.author?.trim() || "Guest",
      content: comment.content,
      createdAt: comment.created_at,
    });
    commentsByImageId.set(comment.image_id, list);
  }

  const imagesByVersion = new Map<number, ProjectFeedbackImage[]>();

  for (const image of [...images].sort((a, b) => {
    if (a.version !== b.version) return b.version - a.version;
    return a.created_at.localeCompare(b.created_at);
  })) {
    const list = imagesByVersion.get(image.version) ?? [];
    list.push({
      id: image.id,
      projectId: image.project_id,
      url: image.url,
      status: normalizeImageStatus(image.status),
      version: image.version,
      createdAt: image.created_at,
      comments: commentsByImageId.get(image.id) ?? [],
    });
    imagesByVersion.set(image.version, list);
  }

  const versions: ProjectVersionGroup[] = Array.from(imagesByVersion.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([version, versionImages]) => ({
      version,
      images: versionImages,
    }));

  return {
    id: project.id,
    name: project.name,
    status: normalizeStatus(project.status),
    createdAt: project.created_at,
    latestVersion: versions[0]?.version ?? 0,
    imageCount: images.length,
    commentCount: comments.length,
    viewerCount: viewers.length,
    versions,
  };
}

async function loadProjectRows(projectId: string) {
  const supabase = getSupabaseAdminClient();

  const [
    { data: projectData, error: projectError },
    { data: commentsData, error: commentsError },
    { data: viewersData, error: viewersError },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, created_at")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("comments")
      .select("id, project_id, image_id, x, y, color, author, content, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("project_viewers")
      .select("id, project_id, email, created_at, last_seen_at")
      .eq("project_id", projectId),
  ]);

  const {
    data: imagesData,
    error: imagesError,
  } = await supabase
    .from("images")
    .select(IMAGE_SELECT_WITH_STATUS)
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .order("created_at", { ascending: true });

  if (projectError) throw projectError;
  let images: ImageRow[] = [];

  if (imagesError) {
    if (!isMissingImageStatusColumnError(imagesError)) {
      throw imagesError;
    }

    const { data: fallbackImagesData, error: fallbackImagesError } = await supabase
      .from("images")
      .select(IMAGE_SELECT_WITHOUT_STATUS)
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .order("created_at", { ascending: true });

    if (fallbackImagesError) throw fallbackImagesError;
    images = ((fallbackImagesData as ImageRow[] | null) ?? []).map((image) => ({
      ...image,
      status: "in_review",
    }));
  } else {
    images = (imagesData as ImageRow[] | null) ?? [];
  }

  if (commentsError) throw commentsError;
  if (viewersError) throw viewersError;

  return {
    project: (projectData as ProjectRow | null) ?? null,
    images,
    comments: (commentsData as CommentRow[] | null) ?? [],
    viewers: (viewersData as ProjectViewerRow[] | null) ?? [],
  };
}

export function isProjectFeedbackConfigured() {
  return isSupabaseConfigured();
}

async function getProjectAccessPassword(projectId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, access_password")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  const project = data as Pick<ProjectRow, "id" | "access_password"> | null;
  if (!project) throw new Error("Project not found.");

  return normalizeAccessPassword(project.access_password);
}

export async function verifyProjectAccessPassword(
  projectId: string,
  password: string,
) {
  const normalizedPassword = normalizeAccessPassword(password);
  if (!normalizedPassword) return false;

  const expectedPassword = await getProjectAccessPassword(projectId);
  return expectedPassword === normalizedPassword;
}

export async function isProjectAccessAuthorized(
  projectId: string,
  password: string | null | undefined,
) {
  const normalizedPassword = normalizeAccessPassword(password);
  if (!normalizedPassword) return false;

  const expectedPassword = await getProjectAccessPassword(projectId);
  return expectedPassword === normalizedPassword;
}

export async function getProjectFeedbackProject(projectId: string) {
  if (!isProjectFeedbackConfigured()) return null;

  const { project, images, comments, viewers } = await loadProjectRows(projectId);
  if (!project) return null;

  return buildProjectPayload(project, images, comments, viewers);
}

export async function registerProjectViewer(input: {
  projectId: string;
  email: string;
}) {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new Error("A valid email is required.");
  }

  const project = await getProjectFeedbackProject(input.projectId);
  if (!project) throw new Error("Project not found.");

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("project_viewers").upsert(
    {
      project_id: input.projectId,
      email,
      last_seen_at: new Date().toISOString(),
    } satisfies Partial<ProjectViewerRow>,
    {
      onConflict: "project_id,email",
    },
  );

  if (error) throw error;

  const nextProject = await getProjectFeedbackProject(input.projectId);
  if (!nextProject) throw new Error("Project not found.");
  return nextProject;
}

export async function listProjectSummaries(options?: {
  includeAccessPassword?: boolean;
  status?: ProjectStatus;
}): Promise<ProjectSummary[]> {
  if (!isProjectFeedbackConfigured()) return [];

  const includeAccessPassword = options?.includeAccessPassword === true;
  const supabase = getSupabaseAdminClient();
  const projectQuery = supabase
    .from("projects")
    .select(
      includeAccessPassword
        ? "id, name, status, access_password, created_at"
        : "id, name, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (options?.status) {
    projectQuery.eq("status", options.status);
  }

  const [
    { data: projectsData, error: projectsError },
    { data: commentsData, error: commentsError },
    { data: viewersData, error: viewersError },
  ] = await Promise.all([
    projectQuery,
    supabase.from("comments").select("id, project_id"),
    supabase.from("project_viewers").select("id, project_id"),
  ]);

  const {
    data: imagesData,
    error: imagesError,
  } = await supabase.from("images").select(IMAGE_SELECT_WITH_STATUS);

  if (projectsError) throw projectsError;
  let images:
    | Array<Pick<ImageRow, "id" | "project_id" | "version" | "url" | "created_at">>
    | [] = [];

  if (imagesError) {
    if (!isMissingImageStatusColumnError(imagesError)) {
      throw imagesError;
    }

    const { data: fallbackImagesData, error: fallbackImagesError } = await supabase
      .from("images")
      .select(IMAGE_SELECT_WITHOUT_STATUS);

    if (fallbackImagesError) throw fallbackImagesError;
    images =
      (fallbackImagesData as Array<
        Pick<ImageRow, "id" | "project_id" | "version" | "url" | "created_at">
      > | null) ?? [];
  } else {
    images =
      (imagesData as Array<
        Pick<ImageRow, "id" | "project_id" | "version" | "url" | "created_at">
      > | null) ?? [];
  }

  if (commentsError) throw commentsError;
  if (viewersError) throw viewersError;

  const projects = (projectsData as unknown as ProjectRow[] | null) ?? [];
  const comments =
    (commentsData as Array<Pick<CommentRow, "id" | "project_id">> | null) ?? [];
  const viewers =
    (viewersData as Array<Pick<ProjectViewerRow, "id" | "project_id">> | null) ??
    [];

  const imageCountByProject = new Map<string, number>();
  const latestVersionByProject = new Map<string, number>();
  const commentCountByProject = new Map<string, number>();
  const viewerCountByProject = new Map<string, number>();
  const coverImageUrlByProject = new Map<string, string>();
  const coverVersionByProject = new Map<string, number>();
  const coverCreatedAtByProject = new Map<string, string>();

  for (const image of images) {
    imageCountByProject.set(
      image.project_id,
      (imageCountByProject.get(image.project_id) ?? 0) + 1,
    );
    latestVersionByProject.set(
      image.project_id,
      Math.max(latestVersionByProject.get(image.project_id) ?? 0, image.version),
    );

    const currentVersion = coverVersionByProject.get(image.project_id) ?? -1;
    const currentCreatedAt = coverCreatedAtByProject.get(image.project_id) ?? "";

    if (
      image.version > currentVersion ||
      (image.version === currentVersion &&
        image.created_at.localeCompare(currentCreatedAt) > 0)
    ) {
      coverVersionByProject.set(image.project_id, image.version);
      coverCreatedAtByProject.set(image.project_id, image.created_at);
      coverImageUrlByProject.set(image.project_id, image.url);
    }
  }

  for (const comment of comments) {
    commentCountByProject.set(
      comment.project_id,
      (commentCountByProject.get(comment.project_id) ?? 0) + 1,
    );
  }

  for (const viewer of viewers) {
    viewerCountByProject.set(
      viewer.project_id,
      (viewerCountByProject.get(viewer.project_id) ?? 0) + 1,
    );
  }

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    status: normalizeStatus(project.status),
    createdAt: project.created_at,
    latestVersion: latestVersionByProject.get(project.id) ?? 0,
    imageCount: imageCountByProject.get(project.id) ?? 0,
    commentCount: commentCountByProject.get(project.id) ?? 0,
    viewerCount: viewerCountByProject.get(project.id) ?? 0,
    coverImageUrl: coverImageUrlByProject.get(project.id) ?? null,
    ...(includeAccessPassword
      ? { accessPassword: normalizeAccessPassword(project.access_password) }
      : {}),
  }));
}

export async function createProject(input: { name: string; accessPassword: string }) {
  const name = input.name.trim();
  if (!name) throw new Error("Project name is required.");
  const accessPassword = normalizeAccessPassword(input.accessPassword);
  if (!accessPassword) throw new Error("Parcel number is required.");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, access_password: accessPassword })
    .select("id, name, status, access_password, created_at")
    .single();

  if (error) throw error;
  const project = data as ProjectRow;

  return {
    id: project.id,
    name: project.name,
    status: normalizeStatus(project.status),
    createdAt: project.created_at,
    latestVersion: 0,
    imageCount: 0,
    commentCount: 0,
    viewerCount: 0,
    coverImageUrl: null,
    accessPassword,
  } satisfies ProjectSummary;
}

export async function updateProjectSettings(
  projectId: string,
  input: { name?: string; accessPassword?: string },
) {
  const updates: Record<string, string> = {};

  if (typeof input.name === "string") {
    const name = input.name.trim();
    if (!name) throw new Error("Project name is required.");
    updates.name = name;
  }

  if (typeof input.accessPassword === "string") {
    const accessPassword = normalizeAccessPassword(input.accessPassword);
    if (!accessPassword) throw new Error("Parcel number is required.");
    updates.access_password = accessPassword;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No project changes were provided.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId);

  if (error) throw error;

  const [project] = await listProjectSummaries({
    includeAccessPassword: true,
  }).then((projects) => projects.filter((item) => item.id === projectId));

  if (!project) throw new Error("Project not found.");
  return project;
}

export async function createProjectComment(input: {
  projectId: string;
  imageId: string;
  x: number;
  y: number;
  color: string;
  viewerEmail: string;
  content: string;
}) {
  if (!Number.isFinite(input.x) || input.x < 0 || input.x > 1) {
    throw new Error("Invalid x coordinate.");
  }

  if (!Number.isFinite(input.y) || input.y < 0 || input.y > 1) {
    throw new Error("Invalid y coordinate.");
  }

  const content = input.content.trim();
  if (!content) throw new Error("Comment content is required.");
  const color = normalizeCommentColor(input.color);
  const author = await resolveProjectViewerAuthor(input.projectId, input.viewerEmail);

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("comments").insert({
    project_id: input.projectId,
    image_id: input.imageId,
    x: input.x,
    y: input.y,
    color,
    author,
    content,
  });

  if (error) throw error;

  const project = await getProjectFeedbackProject(input.projectId);
  if (!project) throw new Error("Project not found.");
  return project;
}

export async function updateProjectComment(input: {
  projectId: string;
  commentId: string;
  color?: string;
  content: string;
}) {
  const content = input.content.trim();
  if (!content) throw new Error("Comment content is required.");

  const updates: Partial<CommentRow> = {
    content,
  };

  if (typeof input.color === "string") {
    updates.color = normalizeCommentColor(input.color);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .update(updates)
    .eq("id", input.commentId)
    .eq("project_id", input.projectId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Edit request not found.");

  const project = await getProjectFeedbackProject(input.projectId);
  if (!project) throw new Error("Project not found.");
  return project;
}

export async function deleteProjectComment(projectId: string, commentId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Edit request not found.");

  const project = await getProjectFeedbackProject(projectId);
  if (!project) throw new Error("Project not found.");
  return project;
}

export async function listProjectImageTeamMessages(
  projectId: string,
  imageId: string,
) {
  const supabase = getSupabaseAdminClient();
  const { data: imageData, error: imageError } = await supabase
    .from("images")
    .select("id")
    .eq("id", imageId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (imageError) throw imageError;
  if (!imageData) throw new Error("Image not found.");

  const { data, error } = await supabase
    .from("image_team_messages")
    .select("id, project_id, image_id, reply_to_id, author, content, created_at")
    .eq("project_id", projectId)
    .eq("image_id", imageId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const messages = (data as TeamMessageRow[] | null) ?? [];
  const messageById = new Map(messages.map((message) => [message.id, message]));
  return messages.map((message) =>
    buildTeamMessagePayload(
      message,
      message.reply_to_id ? (messageById.get(message.reply_to_id) ?? null) : null,
    ),
  );
}

export async function createProjectImageTeamMessage(input: {
  projectId: string;
  imageId: string;
  viewerEmail: string;
  content: string;
  replyToMessageId?: string | null;
}) {
  const content = input.content.trim();
  if (!content) throw new Error("Message content is required.");
  const author = await resolveProjectViewerAuthor(input.projectId, input.viewerEmail);
  const replyToMessageId = input.replyToMessageId?.trim() || null;

  const supabase = getSupabaseAdminClient();
  const { data: imageData, error: imageError } = await supabase
    .from("images")
    .select("id")
    .eq("id", input.imageId)
    .eq("project_id", input.projectId)
    .maybeSingle();

  if (imageError) throw imageError;
  if (!imageData) throw new Error("Image not found.");

  if (replyToMessageId) {
    const { data: replyData, error: replyError } = await supabase
      .from("image_team_messages")
      .select("id")
      .eq("id", replyToMessageId)
      .eq("project_id", input.projectId)
      .eq("image_id", input.imageId)
      .maybeSingle();

    if (replyError) throw replyError;
    if (!replyData) throw new Error("Reply target not found.");
  }

  const { data, error } = await supabase
    .from("image_team_messages")
    .insert({
      project_id: input.projectId,
      image_id: input.imageId,
      reply_to_id: replyToMessageId,
      author,
      content,
    })
    .select("id, project_id, image_id, reply_to_id, author, content, created_at")
    .single();

  if (error) throw error;
  const message = data as TeamMessageRow;

  let replySource: TeamMessageRow | null = null;
  if (message.reply_to_id) {
    const { data: replyData, error: replyError } = await supabase
      .from("image_team_messages")
      .select("id, project_id, image_id, reply_to_id, author, content, created_at")
      .eq("id", message.reply_to_id)
      .maybeSingle();

    if (replyError) throw replyError;
    replySource = (replyData as TeamMessageRow | null) ?? null;
  }

  return buildTeamMessagePayload(message, replySource);
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);

  if (error) throw error;

  const project = await getProjectFeedbackProject(projectId);
  if (!project) throw new Error("Project not found.");
  return project;
}

export async function uploadProjectVersion(
  projectId: string,
  files: File[],
  options?: { targetVersion?: number | null },
) {
  if (files.length === 0) throw new Error("Select at least one image.");

  const supabase = getSupabaseAdminClient();
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) throw projectError;
  const project = projectData as { id: string; name: string } | null;
  if (!project) throw new Error("Project not found.");

  const { data: latestImageData, error: latestImageError } = await supabase
    .from("images")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestImageError) throw latestImageError;
  const latestImage = latestImageData as { version: number } | null;

  const latestVersion = latestImage?.version ?? 0;
  const requestedVersion =
    typeof options?.targetVersion === "number" &&
    Number.isInteger(options.targetVersion) &&
    options.targetVersion > 0
      ? options.targetVersion
      : null;

  if (
    requestedVersion !== null &&
    requestedVersion !== latestVersion &&
    requestedVersion !== latestVersion + 1
  ) {
    throw new Error("Invalid target variant.");
  }

  const nextVersion = requestedVersion ?? latestVersion + 1;
  const rowsToInsert: Array<{
    project_id: string;
    project_name: string;
    url: string;
    status: ProjectStatus;
    version: number;
  }> = [];

  for (const file of files) {
    if (!file.type.toLowerCase().startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }

    const uploadPath = createImagePath(projectId, nextVersion, file);
    const { error: uploadError } = await supabase.storage
      .from(PROJECT_IMAGE_BUCKET)
      .upload(uploadPath, Buffer.from(await file.arrayBuffer()), {
        // Files are uploaded to a unique path per version, so a long browser TTL is safe.
        cacheControl: PROJECT_ASSET_BROWSER_CACHE_TTL_SECONDS,
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(PROJECT_IMAGE_BUCKET)
      .getPublicUrl(uploadPath);

    rowsToInsert.push({
      project_id: projectId,
      project_name: project.name,
      url: data.publicUrl,
      status: "in_review",
      version: nextVersion,
    });
  }

  const { error: insertError } = await supabase.from("images").insert(rowsToInsert);
  if (insertError) {
    if (!isMissingImageStatusColumnError(insertError)) throw insertError;

    const fallbackRowsToInsert = rowsToInsert.map((row) => ({
      project_id: row.project_id,
      project_name: row.project_name,
      url: row.url,
      version: row.version,
    }));
    const { error: fallbackInsertError } = await supabase
      .from("images")
      .insert(fallbackRowsToInsert);

    if (fallbackInsertError) throw fallbackInsertError;
  }

  const nextProject = await getProjectFeedbackProject(projectId);
  if (!nextProject) throw new Error("Project not found.");
  return {
    project: nextProject,
    version: nextVersion,
  };
}

export async function deleteProjectImage(projectId: string, imageId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("images")
    .select("id, project_id, url")
    .eq("id", imageId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  const image = data as Pick<ImageRow, "id" | "project_id" | "url"> | null;
  if (!image) throw new Error("Image not found.");

  const storagePath = getStoragePathFromPublicUrl(image.url);

  const { error: deleteError } = await supabase
    .from("images")
    .delete()
    .eq("id", imageId)
    .eq("project_id", projectId);

  if (deleteError) throw deleteError;

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(PROJECT_IMAGE_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      console.warn("Failed to delete image asset from storage:", storageError.message);
    }
  }

  const nextProject = await getProjectFeedbackProject(projectId);
  if (!nextProject) throw new Error("Project not found.");
  return nextProject;
}

export async function replaceProjectImage(
  projectId: string,
  imageId: string,
  file: File,
) {
  if (!file.type.toLowerCase().startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("images")
    .select("id, project_id, project_name, url, version")
    .eq("id", imageId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  const image = data as Pick<
    ImageRow,
    "id" | "project_id" | "project_name" | "url" | "version"
  > | null;
  if (!image) throw new Error("Image not found.");

  const nextPath = createImagePath(projectId, image.version, file);
  const { error: uploadError } = await supabase.storage
    .from(PROJECT_IMAGE_BUCKET)
    .upload(nextPath, Buffer.from(await file.arrayBuffer()), {
      cacheControl: PROJECT_ASSET_BROWSER_CACHE_TTL_SECONDS,
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from(PROJECT_IMAGE_BUCKET)
    .getPublicUrl(nextPath);

  const oldStoragePath = getStoragePathFromPublicUrl(image.url);
  const { error: updateError } = await supabase
    .from("images")
    .update({
      url: publicUrlData.publicUrl,
    })
    .eq("id", imageId)
    .eq("project_id", projectId);

  if (updateError) throw updateError;

  if (oldStoragePath) {
    const { error: storageError } = await supabase.storage
      .from(PROJECT_IMAGE_BUCKET)
      .remove([oldStoragePath]);

    if (storageError) {
      console.warn("Failed to remove replaced image asset from storage:", storageError.message);
    }
  }

  const nextProject = await getProjectFeedbackProject(projectId);
  if (!nextProject) throw new Error("Project not found.");
  return nextProject;
}

export async function getProjectImageDownloadAsset(
  projectId: string,
  imageId: string,
): Promise<ProjectImageDownloadAsset> {
  const supabase = getSupabaseAdminClient();

  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) throw projectError;
  const project = projectData as Pick<ProjectRow, "id" | "name"> | null;
  if (!project) throw new Error("Project not found.");

  const { data: imageData, error: imageError } = await supabase
    .from("images")
    .select(IMAGE_DOWNLOAD_SELECT_WITH_STATUS)
    .eq("id", imageId)
    .eq("project_id", projectId)
    .maybeSingle();

  let image: Pick<ImageRow, "id" | "url" | "status" | "version"> | null = null;

  if (imageError) {
    if (!isMissingImageStatusColumnError(imageError)) throw imageError;

    const {
      data: fallbackImageData,
      error: fallbackImageError,
    } = await supabase
      .from("images")
      .select(IMAGE_DOWNLOAD_SELECT_WITHOUT_STATUS)
      .eq("id", imageId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (fallbackImageError) throw fallbackImageError;
    image = fallbackImageData
      ? ({
          ...(fallbackImageData as Pick<ImageRow, "id" | "url" | "version">),
          status: "in_review",
        } satisfies Pick<ImageRow, "id" | "url" | "status" | "version">)
      : null;
  } else {
    image = imageData as Pick<ImageRow, "id" | "url" | "status" | "version"> | null;
  }

  if (!image) throw new Error("Image not found.");
  if (normalizeImageStatus(image.status) !== "approved") {
    throw new Error("Image is not approved for download.");
  }

  const extension = extensionFromUrl(image.url);
  const filename = `${sanitizeFilename(project.name)}-v${image.version}-${image.id.slice(0, 8)}${extension}`;

  return {
    filename,
    url: image.url,
  };
}

export async function updateProjectImageStatus(
  projectId: string,
  imageId: string,
  status: ProjectStatus,
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("images")
    .update({ status })
    .eq("id", imageId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMissingImageStatusColumnError(error)) {
      throw buildImageStatusMigrationError();
    }
    throw error;
  }
  if (!data) throw new Error("Image not found.");

  const project = await getProjectFeedbackProject(projectId);
  if (!project) throw new Error("Project not found.");
  return project;
}
