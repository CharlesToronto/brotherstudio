import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  ProjectReferenceFile,
  ProjectReferenceFolder,
  ProjectReferences,
} from "@/lib/projectFeedbackTypes";

const PROJECT_REFERENCE_BUCKET = "project-references";
const PROJECT_REFERENCE_CACHE_TTL_SECONDS = "31536000";

export const DEFAULT_PROJECT_REFERENCE_FOLDERS = [
  "Mobilier inspiration",
  "Aménagement",
  "Vue des environs",
] as const;

type ReferenceFolderRow = {
  id: string;
  project_id: string;
  name: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type ReferenceFileRow = {
  id: string;
  project_id: string;
  folder_id: string;
  title: string;
  description: string | null;
  filename: string;
  url: string;
  mime_type: string | null;
  size_bytes: number | string | null;
  created_at: string;
  updated_at: string;
};

export type PreparedProjectReferenceUpload = {
  path: string;
  signedUrl: string;
  token: string;
  publicUrl: string;
  filename: string;
  mimeType: string;
};

function sanitizeStorageFilename(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "reference"
  );
}

function normalizeDisplayFilename(name: string) {
  const normalized = name.replace(/[\\/]/g, "").trim();
  return normalized.slice(0, 240) || "reference";
}

function normalizeTitle(title: string | undefined, filename: string) {
  const normalized = title?.trim().slice(0, 160) || filename.replace(/\.[^.]+$/, "");
  return normalized || "Reference";
}

function normalizeDescription(description: string | undefined) {
  return description?.trim().slice(0, 500) ?? "";
}

function normalizeMimeType(mimeType: string | undefined) {
  return mimeType?.trim().slice(0, 160) || "application/octet-stream";
}

function normalizeSizeBytes(sizeBytes: number | undefined) {
  return typeof sizeBytes === "number" && Number.isFinite(sizeBytes) && sizeBytes >= 0
    ? Math.floor(sizeBytes)
    : 0;
}

function createReferencePath(
  projectId: string,
  folderId: string,
  filename: string,
) {
  return `${projectId}/references/${folderId}/${crypto.randomUUID()}-${sanitizeStorageFilename(filename)}`;
}

function getStoragePathFromReferenceUrl(url: string) {
  const marker = `/storage/v1/object/public/${PROJECT_REFERENCE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length).split("?")[0] ?? "");
}

function buildFolderPayload(row: ReferenceFolderRow): ProjectReferenceFolder {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildFilePayload(row: ReferenceFileRow): ProjectReferenceFile {
  return {
    id: row.id,
    projectId: row.project_id,
    folderId: row.folder_id,
    title: row.title,
    description: row.description ?? "",
    filename: row.filename,
    url: row.url,
    mimeType: row.mime_type ?? "application/octet-stream",
    sizeBytes: Number(row.size_bytes ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function assertProjectExists(projectId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Project not found.");
}

async function getProjectReferenceFolder(projectId: string, folderId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("project_reference_folders")
    .select("id, project_id, name, is_default, sort_order, created_at, updated_at")
    .eq("id", folderId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Reference folder not found.");
  return data as ReferenceFolderRow;
}

async function ensureDefaultProjectReferenceFolders(projectId: string) {
  await assertProjectExists(projectId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("project_reference_folders")
    .select("name")
    .eq("project_id", projectId);

  if (error) throw error;

  const existingNames = new Set(
    ((data as Array<{ name: string }> | null) ?? []).map((folder) => folder.name),
  );
  const missingFolders = DEFAULT_PROJECT_REFERENCE_FOLDERS.filter(
    (name) => !existingNames.has(name),
  ).map((name, index) => ({
    project_id: projectId,
    name,
    is_default: true,
    sort_order: index,
  }));

  if (missingFolders.length > 0) {
    const { error: insertError } = await supabase
      .from("project_reference_folders")
      .insert(missingFolders);
    if (insertError) throw insertError;
  }
}

export async function listProjectReferences(projectId: string): Promise<ProjectReferences> {
  await ensureDefaultProjectReferenceFolders(projectId);
  const supabase = getSupabaseAdminClient();
  const [foldersResult, filesResult] = await Promise.all([
    supabase
      .from("project_reference_folders")
      .select("id, project_id, name, is_default, sort_order, created_at, updated_at")
      .eq("project_id", projectId)
      .order("is_default", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("project_reference_files")
      .select(
        "id, project_id, folder_id, title, description, filename, url, mime_type, size_bytes, created_at, updated_at",
      )
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false }),
  ]);

  if (foldersResult.error) throw foldersResult.error;
  if (filesResult.error) throw filesResult.error;

  return {
    folders: ((foldersResult.data as ReferenceFolderRow[] | null) ?? []).map(
      buildFolderPayload,
    ),
    files: ((filesResult.data as ReferenceFileRow[] | null) ?? []).map(buildFilePayload),
  };
}

export async function createProjectReferenceFolder(projectId: string, name: string) {
  await assertProjectExists(projectId);
  const normalizedName = name.trim().slice(0, 120);
  if (!normalizedName) throw new Error("Folder name is required.");

  const supabase = getSupabaseAdminClient();
  const { data: existingFolder, error: existingError } = await supabase
    .from("project_reference_folders")
    .select("id")
    .eq("project_id", projectId)
    .ilike("name", normalizedName)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingFolder) throw new Error("A folder with this name already exists.");

  const { data: maxSortData, error: maxSortError } = await supabase
    .from("project_reference_folders")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxSortError) throw maxSortError;
  const { data, error } = await supabase
    .from("project_reference_folders")
    .insert({
      project_id: projectId,
      name: normalizedName,
      is_default: false,
      sort_order: Number(maxSortData?.sort_order ?? 0) + 1,
    })
    .select("id, project_id, name, is_default, sort_order, created_at, updated_at")
    .single();

  if (error) throw error;
  return buildFolderPayload(data as ReferenceFolderRow);
}

export async function renameProjectReferenceFolder(
  projectId: string,
  folderId: string,
  name: string,
) {
  await getProjectReferenceFolder(projectId, folderId);
  const normalizedName = name.trim().slice(0, 120);
  if (!normalizedName) throw new Error("Folder name is required.");

  const supabase = getSupabaseAdminClient();
  const { data: existingFolder, error: existingError } = await supabase
    .from("project_reference_folders")
    .select("id")
    .eq("project_id", projectId)
    .ilike("name", normalizedName)
    .neq("id", folderId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingFolder) throw new Error("A folder with this name already exists.");

  const { data, error } = await supabase
    .from("project_reference_folders")
    .update({ name: normalizedName })
    .eq("id", folderId)
    .eq("project_id", projectId)
    .select("id, project_id, name, is_default, sort_order, created_at, updated_at")
    .single();

  if (error) throw error;
  return buildFolderPayload(data as ReferenceFolderRow);
}

export async function deleteProjectReferenceFolder(projectId: string, folderId: string) {
  const folder = await getProjectReferenceFolder(projectId, folderId);
  if (folder.is_default) throw new Error("Default folders cannot be deleted.");

  const supabase = getSupabaseAdminClient();
  const { data: files, error: filesError } = await supabase
    .from("project_reference_files")
    .select("url")
    .eq("project_id", projectId)
    .eq("folder_id", folderId);

  if (filesError) throw filesError;
  const { error } = await supabase
    .from("project_reference_folders")
    .delete()
    .eq("id", folderId)
    .eq("project_id", projectId);

  if (error) throw error;

  const storagePaths = ((files as Array<{ url: string }> | null) ?? [])
    .map((file) => getStoragePathFromReferenceUrl(file.url))
    .filter((path): path is string => Boolean(path));
  if (storagePaths.length > 0) {
    await supabase.storage.from(PROJECT_REFERENCE_BUCKET).remove(storagePaths);
  }
}

export async function prepareProjectReferenceUploads(
  projectId: string,
  folderId: string,
  files: Array<{ name: string; type: string }>,
) {
  if (files.length === 0) throw new Error("Select at least one reference file.");
  await getProjectReferenceFolder(projectId, folderId);

  const supabase = getSupabaseAdminClient();
  const uploads: PreparedProjectReferenceUpload[] = [];

  for (const file of files) {
    const filename = normalizeDisplayFilename(file.name);
    const path = createReferencePath(projectId, folderId, filename);
    const { data, error } = await supabase.storage
      .from(PROJECT_REFERENCE_BUCKET)
      .createSignedUploadUrl(path);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(PROJECT_REFERENCE_BUCKET)
      .getPublicUrl(path);

    uploads.push({
      path: data.path,
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl: publicUrlData.publicUrl,
      filename,
      mimeType: normalizeMimeType(file.type),
    });
  }

  return { uploads };
}

export async function commitProjectReferenceUploads(
  projectId: string,
  input: {
    folderId: string;
    uploads: Array<{
      publicUrl: string;
      filename: string;
      mimeType?: string;
      sizeBytes?: number;
      title?: string;
      description?: string;
    }>;
  },
) {
  await getProjectReferenceFolder(projectId, input.folderId);
  if (input.uploads.length === 0) throw new Error("Select at least one reference file.");

  const supabase = getSupabaseAdminClient();
  const rows = input.uploads.map((upload) => {
    const filename = normalizeDisplayFilename(upload.filename);
    const publicUrl = upload.publicUrl.trim();
    if (!publicUrl.includes(`/storage/v1/object/public/${PROJECT_REFERENCE_BUCKET}/`)) {
      throw new Error("Invalid reference upload.");
    }

    return {
      project_id: projectId,
      folder_id: input.folderId,
      title: normalizeTitle(upload.title, filename),
      description: normalizeDescription(upload.description),
      filename,
      url: publicUrl,
      mime_type: normalizeMimeType(upload.mimeType),
      size_bytes: normalizeSizeBytes(upload.sizeBytes),
    };
  });

  const { error } = await supabase.from("project_reference_files").insert(rows);
  if (error) throw error;
  return listProjectReferences(projectId);
}

export async function createProjectReferenceLink(
  projectId: string,
  input: {
    folderId: string;
    url: string;
    title?: string;
    description?: string;
  },
) {
  await getProjectReferenceFolder(projectId, input.folderId);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.url.trim());
  } catch {
    throw new Error("Enter a valid URL.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Only http and https links are supported.");
  }

  const pathFilename = parsedUrl.pathname.split("/").filter(Boolean).pop();
  const filename = normalizeDisplayFilename(pathFilename || parsedUrl.hostname);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("project_reference_files").insert({
    project_id: projectId,
    folder_id: input.folderId,
    title: normalizeTitle(input.title, parsedUrl.hostname),
    description: normalizeDescription(input.description),
    filename,
    url: parsedUrl.toString(),
    mime_type: "application/x-reference-link",
    size_bytes: 0,
  });

  if (error) throw error;
  return listProjectReferences(projectId);
}

export async function updateProjectReferenceFile(
  projectId: string,
  fileId: string,
  input: { title?: string; description?: string; folderId?: string },
) {
  const supabase = getSupabaseAdminClient();
  const { data: existingFile, error: existingError } = await supabase
    .from("project_reference_files")
    .select("id, folder_id")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existingFile) throw new Error("Reference file not found.");

  const updates: Record<string, string> = {};
  if (typeof input.title === "string") {
    const title = input.title.trim().slice(0, 160);
    if (!title) throw new Error("Reference title is required.");
    updates.title = title;
  }
  if (typeof input.description === "string") {
    updates.description = normalizeDescription(input.description);
  }
  if (typeof input.folderId === "string") {
    await getProjectReferenceFolder(projectId, input.folderId);
    updates.folder_id = input.folderId;
  }

  if (Object.keys(updates).length === 0) throw new Error("No reference changes were provided.");

  const { error } = await supabase
    .from("project_reference_files")
    .update(updates)
    .eq("id", fileId)
    .eq("project_id", projectId);
  if (error) throw error;

  return listProjectReferences(projectId);
}

export async function deleteProjectReferenceFile(projectId: string, fileId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("project_reference_files")
    .select("id, url")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Reference file not found.");

  const { error: deleteError } = await supabase
    .from("project_reference_files")
    .delete()
    .eq("id", fileId)
    .eq("project_id", projectId);
  if (deleteError) throw deleteError;

  const storagePath = getStoragePathFromReferenceUrl(data.url);
  if (storagePath) {
    await supabase.storage.from(PROJECT_REFERENCE_BUCKET).remove([storagePath]);
  }

  return listProjectReferences(projectId);
}

export async function getProjectReferenceDownloadAsset(projectId: string, fileId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("project_reference_files")
    .select("id, filename, url, mime_type")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Reference file not found.");

  return {
    filename: normalizeDisplayFilename(data.filename),
    mimeType: normalizeMimeType(data.mime_type ?? undefined),
    url: data.url,
  };
}

export async function listProjectReferenceFileUrls(projectId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("project_reference_files")
    .select("url")
    .eq("project_id", projectId);
  if (error) throw error;
  return ((data as Array<{ url: string }> | null) ?? [])
    .map((file) => getStoragePathFromReferenceUrl(file.url))
    .filter((path): path is string => Boolean(path));
}

export { PROJECT_REFERENCE_BUCKET, PROJECT_REFERENCE_CACHE_TTL_SECONDS };
