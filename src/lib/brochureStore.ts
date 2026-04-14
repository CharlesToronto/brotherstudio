import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  BrochureApprovedImage,
  BrochureAsset,
  BrochureFontFamily,
  BrochureProject,
  BrochureProjectSummary,
  BrochureSettings,
  BrochureTemplate,
} from "@/lib/brochureTypes";
import type { ProjectStatus } from "@/lib/projectFeedbackTypes";

const BROCHURE_ASSET_BUCKET = "brochure-assets";
const BROCHURE_BROWSER_CACHE_TTL_SECONDS = "31536000";

type ProjectRow = {
  id: string;
  name: string;
  created_at: string;
};

type ImageRow = {
  id: string;
  project_id: string;
  url: string;
  status: string | null;
  version: number;
  created_at: string;
};

type BrochureSettingsRow = {
  project_id: string;
  template: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  heading_color: string | null;
  body_color: string | null;
  accent_color: string | null;
  font_family: string | null;
  selected_image_ids: unknown;
  logo_url: string | null;
  updated_at: string | null;
};

type BrochureAssetRow = {
  id: string;
  project_id: string;
  kind: string | null;
  url: string;
  file_name: string | null;
  created_at: string;
};

const IMAGE_SELECT_WITH_STATUS = "id, project_id, url, status, version, created_at";

function normalizeTemplate(value: string | null | undefined): BrochureTemplate {
  return value === "minimal" || value === "luxury" ? value : "modern";
}

function normalizeFontFamily(
  value: string | null | undefined,
): BrochureFontFamily {
  return value === "garamond" ||
    value === "georgia" ||
    value === "times"
    ? value
    : "helvetica";
}

function normalizeColor(value: string | null | undefined, fallback: string) {
  const color = value?.trim().toLowerCase() ?? "";
  return /^#[0-9a-f]{6}$/.test(color) ? color : fallback;
}

function normalizeSelectedImageIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter((entry): entry is string => typeof entry === "string");
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
    combined.includes('column "status" does not exist')
  );
}

function isMissingBrochureTableError(error: unknown) {
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
    code === "42P01" ||
    code === "PGRST205" ||
    combined.includes("brochure_settings") ||
    combined.includes("brochure_assets")
  );
}

function buildBrochureSetupError() {
  return new Error(
    "Run the latest myBrochure SQL migration before opening the brochure builder.",
  );
}

function sanitizeFilename(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "asset"
  );
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

function createBrochureAssetPath(
  projectId: string,
  kind: "logo" | "extra",
  file: File,
) {
  const extension = extensionForFile(file);
  const baseName = sanitizeFilename(file.name.replace(/\.[^.]+$/, ""));
  return `${projectId}/${kind}/${crypto.randomUUID()}-${baseName}${extension}`;
}

function getStoragePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${BROCHURE_ASSET_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length).split("?")[0] ?? "");
}

function buildApprovedImage(image: ImageRow): BrochureApprovedImage {
  return {
    id: image.id,
    projectId: image.project_id,
    url: image.url,
    version: image.version,
    createdAt: image.created_at,
  };
}

function buildDefaultSettings(
  projectId: string,
  projectName: string,
  approvedImages: BrochureApprovedImage[],
): BrochureSettings {
  return {
    projectId,
    template: "modern",
    title: projectName,
    subtitle: "High-end visualizations ready for marketing use.",
    body:
      "Select your approved renders, adjust the style, then export a brochure-ready presentation for your next client share or sales package.",
    headingColor: "#111111",
    bodyColor: "#5f5f5f",
    accentColor: "#c40018",
    fontFamily: "helvetica",
    selectedImageIds: approvedImages.map((image) => image.id),
    logoUrl: null,
    updatedAt: null,
  };
}

function buildSettings(
  row: BrochureSettingsRow | null,
  projectId: string,
  projectName: string,
  approvedImages: BrochureApprovedImage[],
): BrochureSettings {
  if (!row) {
    return buildDefaultSettings(projectId, projectName, approvedImages);
  }

  const allowedImageIds = new Set(approvedImages.map((image) => image.id));
  const selectedImageIds = normalizeSelectedImageIds(row.selected_image_ids).filter((id) =>
    allowedImageIds.has(id),
  );

  return {
    projectId,
    template: normalizeTemplate(row.template),
    title: row.title?.trim() || projectName,
    subtitle:
      row.subtitle?.trim() || "High-end visualizations ready for marketing use.",
    body:
      row.body?.trim() ||
      "Select your approved renders, adjust the style, then export a brochure-ready presentation for your next client share or sales package.",
    headingColor: normalizeColor(row.heading_color, "#111111"),
    bodyColor: normalizeColor(row.body_color, "#5f5f5f"),
    accentColor: normalizeColor(row.accent_color, "#c40018"),
    fontFamily: normalizeFontFamily(row.font_family),
    selectedImageIds,
    logoUrl: row.logo_url?.trim() || null,
    updatedAt: row.updated_at ?? null,
  };
}

function buildAsset(row: BrochureAssetRow): BrochureAsset {
  return {
    id: row.id,
    projectId: row.project_id,
    kind: "extra",
    url: row.url,
    fileName: row.file_name?.trim() || "asset",
    createdAt: row.created_at,
  };
}

async function listApprovedProjectImages(projectId?: string) {
  const supabase = getSupabaseAdminClient();
  const query = supabase
    .from("images")
    .select(IMAGE_SELECT_WITH_STATUS)
    .eq("status", "approved")
    .order("version", { ascending: false })
    .order("created_at", { ascending: true });

  if (projectId) {
    query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingImageStatusColumnError(error)) {
      throw new Error(
        "Run the latest myStudio image-status SQL migration before using myBrochure.",
      );
    }
    throw error;
  }

  return (data as ImageRow[] | null) ?? [];
}

export function isBrochureConfigured() {
  return isSupabaseConfigured();
}

export async function listBrochureProjectSummaries(): Promise<BrochureProjectSummary[]> {
  if (!isBrochureConfigured()) return [];

  const supabase = getSupabaseAdminClient();
  const [{ data: projectsData, error: projectsError }, approvedImages] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, created_at")
        .order("created_at", { ascending: false }),
      listApprovedProjectImages(),
    ]);

  if (projectsError) throw projectsError;

  const projects = (projectsData as ProjectRow[] | null) ?? [];
  const imageCountByProject = new Map<string, number>();
  const latestVersionByProject = new Map<string, number>();
  const coverImageUrlByProject = new Map<string, string>();
  const coverVersionByProject = new Map<string, number>();
  const coverCreatedAtByProject = new Map<string, string>();

  for (const image of approvedImages) {
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

  return projects
    .filter((project) => (imageCountByProject.get(project.id) ?? 0) > 0)
    .map((project) => ({
      id: project.id,
      name: project.name,
      createdAt: project.created_at,
      coverImageUrl: coverImageUrlByProject.get(project.id) ?? null,
      approvedImageCount: imageCountByProject.get(project.id) ?? 0,
      latestApprovedVersion: latestVersionByProject.get(project.id) ?? 0,
    }));
}

export async function getBrochureProject(
  projectId: string,
): Promise<BrochureProject | null> {
  if (!isBrochureConfigured()) return null;

  const supabase = getSupabaseAdminClient();
  const [{ data: projectData, error: projectError }, approvedImages] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, created_at")
        .eq("id", projectId)
        .maybeSingle(),
      listApprovedProjectImages(projectId),
    ]);

  if (projectError) throw projectError;
  const project = (projectData as ProjectRow | null) ?? null;
  if (!project) return null;

  let settingsData: BrochureSettingsRow | null = null;
  let assetsData: BrochureAssetRow[] = [];

  try {
    const [
      { data: brochureSettingsData, error: brochureSettingsError },
      { data: brochureAssetsData, error: brochureAssetsError },
    ] = await Promise.all([
      supabase
        .from("brochure_settings")
        .select(
          "project_id, template, title, subtitle, body, heading_color, body_color, accent_color, font_family, selected_image_ids, logo_url, updated_at",
        )
        .eq("project_id", projectId)
        .maybeSingle(),
      supabase
        .from("brochure_assets")
        .select("id, project_id, kind, url, file_name, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);

    if (brochureSettingsError) throw brochureSettingsError;
    if (brochureAssetsError) throw brochureAssetsError;

    settingsData = (brochureSettingsData as BrochureSettingsRow | null) ?? null;
    assetsData = (brochureAssetsData as BrochureAssetRow[] | null) ?? [];
  } catch (error) {
    if (isMissingBrochureTableError(error)) {
      throw buildBrochureSetupError();
    }
    throw error;
  }

  const mappedImages = approvedImages.map(buildApprovedImage);
  const settings = buildSettings(settingsData, project.id, project.name, mappedImages);
  const summary = (
    await listBrochureProjectSummaries()
  ).find((entry) => entry.id === projectId);

  return {
    id: project.id,
    name: project.name,
    createdAt: project.created_at,
    coverImageUrl: summary?.coverImageUrl ?? mappedImages[0]?.url ?? null,
    approvedImageCount: mappedImages.length,
    latestApprovedVersion:
      summary?.latestApprovedVersion ??
      mappedImages.reduce((max, image) => Math.max(max, image.version), 0),
    settings,
    approvedImages: mappedImages,
    assets: assetsData
      .filter((asset) => asset.kind === "extra" || asset.kind === null)
      .map(buildAsset),
  };
}

function normalizeSelectedImageIdsForSave(
  value: string[] | null | undefined,
  approvedImages: BrochureApprovedImage[],
) {
  const allowedImageIds = new Set(approvedImages.map((image) => image.id));
  const selected = Array.isArray(value) ? value : [];

  return selected.filter((id) => allowedImageIds.has(id));
}

export async function saveBrochureSettings(
  projectId: string,
  input: {
    template?: BrochureTemplate;
    title?: string;
    subtitle?: string;
    body?: string;
    headingColor?: string;
    bodyColor?: string;
    accentColor?: string;
    fontFamily?: BrochureFontFamily;
    selectedImageIds?: string[];
  },
) {
  const project = await getBrochureProject(projectId);
  if (!project) throw new Error("Project not found.");

  const nextTemplate = normalizeTemplate(input.template ?? project.settings.template);
  const nextFontFamily = normalizeFontFamily(
    input.fontFamily ?? project.settings.fontFamily,
  );
  const nextSelectedImageIds = normalizeSelectedImageIdsForSave(
    input.selectedImageIds ?? project.settings.selectedImageIds,
    project.approvedImages,
  );

  const payload = {
    project_id: projectId,
    template: nextTemplate,
    title: input.title?.trim() ?? project.settings.title,
    subtitle: input.subtitle?.trim() ?? project.settings.subtitle,
    body: input.body?.trim() ?? project.settings.body,
    heading_color: normalizeColor(
      input.headingColor ?? project.settings.headingColor,
      "#111111",
    ),
    body_color: normalizeColor(
      input.bodyColor ?? project.settings.bodyColor,
      "#5f5f5f",
    ),
    accent_color: normalizeColor(
      input.accentColor ?? project.settings.accentColor,
      "#c40018",
    ),
    font_family: nextFontFamily,
    selected_image_ids: nextSelectedImageIds,
    logo_url: project.settings.logoUrl,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("brochure_settings").upsert(payload, {
    onConflict: "project_id",
  });

  if (error) {
    if (isMissingBrochureTableError(error)) {
      throw buildBrochureSetupError();
    }
    throw error;
  }

  const nextProject = await getBrochureProject(projectId);
  if (!nextProject) throw new Error("Project not found.");
  return nextProject;
}

async function uploadBrochureFile(
  projectId: string,
  file: File,
  kind: "logo" | "extra",
) {
  if (!file.type.toLowerCase().startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const supabase = getSupabaseAdminClient();
  const uploadPath = createBrochureAssetPath(projectId, kind, file);
  const { error: uploadError } = await supabase.storage
    .from(BROCHURE_ASSET_BUCKET)
    .upload(uploadPath, Buffer.from(await file.arrayBuffer()), {
      cacheControl: BROCHURE_BROWSER_CACHE_TTL_SECONDS,
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(BROCHURE_ASSET_BUCKET)
    .getPublicUrl(uploadPath);

  return data.publicUrl;
}

export async function uploadBrochureLogo(projectId: string, file: File) {
  const project = await getBrochureProject(projectId);
  if (!project) throw new Error("Project not found.");

  const nextLogoUrl = await uploadBrochureFile(projectId, file, "logo");
  const previousLogoUrl = project.settings.logoUrl;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("brochure_settings").upsert(
    {
      project_id: projectId,
      template: project.settings.template,
      title: project.settings.title,
      subtitle: project.settings.subtitle,
      body: project.settings.body,
      heading_color: project.settings.headingColor,
      body_color: project.settings.bodyColor,
      accent_color: project.settings.accentColor,
      font_family: project.settings.fontFamily,
      selected_image_ids: project.settings.selectedImageIds,
      logo_url: nextLogoUrl,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "project_id",
    },
  );

  if (error) {
    if (isMissingBrochureTableError(error)) {
      throw buildBrochureSetupError();
    }
    throw error;
  }

  const oldStoragePath = previousLogoUrl
    ? getStoragePathFromPublicUrl(previousLogoUrl)
    : null;

  if (oldStoragePath) {
    const { error: removeError } = await supabase.storage
      .from(BROCHURE_ASSET_BUCKET)
      .remove([oldStoragePath]);

    if (removeError) {
      console.warn("Failed to remove previous brochure logo:", removeError.message);
    }
  }

  const nextProject = await getBrochureProject(projectId);
  if (!nextProject) throw new Error("Project not found.");
  return nextProject;
}

export async function uploadBrochureAssets(projectId: string, files: File[]) {
  if (files.length === 0) throw new Error("Select at least one image.");

  const project = await getBrochureProject(projectId);
  if (!project) throw new Error("Project not found.");

  const supabase = getSupabaseAdminClient();
  const rowsToInsert: Array<{
    project_id: string;
    kind: "extra";
    url: string;
    file_name: string;
  }> = [];

  for (const file of files) {
    const publicUrl = await uploadBrochureFile(projectId, file, "extra");
    rowsToInsert.push({
      project_id: projectId,
      kind: "extra",
      url: publicUrl,
      file_name: file.name.trim() || "asset",
    });
  }

  const { error } = await supabase.from("brochure_assets").insert(rowsToInsert);
  if (error) {
    if (isMissingBrochureTableError(error)) {
      throw buildBrochureSetupError();
    }
    throw error;
  }

  const nextProject = await getBrochureProject(projectId);
  if (!nextProject) throw new Error("Project not found.");
  return nextProject;
}

export async function updateBrochureProjectStatus(
  projectId: string,
  status: ProjectStatus,
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);

  if (error) throw error;

  return getBrochureProject(projectId);
}
