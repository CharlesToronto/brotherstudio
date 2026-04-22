import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  BROCHURE_SECTION_DEFINITIONS,
  createBrochureSection,
  getBrochureSectionDefinition,
} from "@/lib/brochureSections";
import {
  normalizeSocialLinks,
  sanitizeCanvasItems,
} from "@/lib/brochureCanvas";
import type {
  BrochureApprovedImage,
  BrochureAsset,
  BrochureContent,
  BrochureExperienceMode,
  BrochureFontFamily,
  BrochureImmersiveAnimationLevel,
  BrochureImmersiveBuilder,
  BrochureImmersiveMediaAspect,
  BrochureImmersiveMotionPreset,
  BrochureImmersiveSectionKey,
  BrochureImmersiveSettings,
  BrochureImmersiveTheme,
  BrochureImmersiveVideoMode,
  BrochureImmersiveVisualStyle,
  BrochureOrientation,
  BrochureProject,
  BrochureProjectSummary,
  BrochureSection,
  BrochureSectionKind,
  BrochureSocialLinks,
  BrochureStyleSettings,
  BrochureTemplate,
} from "@/lib/brochureTypes";
import type { ProjectStatus } from "@/lib/projectFeedbackTypes";

const BROCHURE_ASSET_BUCKET = "brochure-assets";
const BROCHURE_BROWSER_CACHE_TTL_SECONDS = "31536000";
const DEFAULT_ACCENT_COLOR = "#c40018";

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

type BrochureRow = {
  id: string;
  project_id: string;
  user_id: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  template: string | null;
  style_settings: unknown;
  content_json: unknown;
  created_at: string;
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
const BROCHURE_SELECT =
  "id, project_id, user_id, title, subtitle, body, template, style_settings, content_json, created_at, updated_at";

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

function normalizeOrientation(
  value: string | null | undefined,
): BrochureOrientation {
  return value === "landscape" ? "landscape" : "portrait";
}

function normalizeColor(value: string | null | undefined, fallback: string) {
  const color = value?.trim().toLowerCase() ?? "";
  return /^#[0-9a-f]{6}$/.test(color) ? color : fallback;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

// Like normalizeString, but preserves the distinction between "missing" and "present but empty".
// We need this so users can intentionally clear copy (""), without the sanitizers re-injecting defaults.
function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter((entry): entry is string => typeof entry === "string");
}

function normalizeTrimmedStringArray(value: unknown) {
  return normalizeStringArray(value)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeSectionKind(value: unknown): BrochureSectionKind | null {
  if (typeof value !== "string") return null;

  return BROCHURE_SECTION_DEFINITIONS.some((definition) => definition.kind === value)
    ? (value as BrochureSectionKind)
    : null;
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
    combined.includes("brochures") ||
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

function canonicalApprovedImageId(refId: string) {
  return `approved:${refId}`;
}

function canonicalExtraAssetId(refId: string) {
  return `asset:${refId}`;
}

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function buildApprovedImage(row: ImageRow, index: number): BrochureApprovedImage {
  return {
    id: canonicalApprovedImageId(row.id),
    refId: row.id,
    source: "approved",
    projectId: row.project_id,
    url: row.url,
    label: `Render ${String(index + 1).padStart(2, "0")}`,
    meta: `Approved • Variant V${row.version}`,
    createdAt: row.created_at,
    version: row.version,
  };
}

function buildExtraAsset(row: BrochureAssetRow, index: number): BrochureAsset {
  const fileName = row.file_name?.trim() || `Extra image ${index + 1}`;

  return {
    id: canonicalExtraAssetId(row.id),
    refId: row.id,
    source: "extra",
    projectId: row.project_id,
    url: row.url,
    label: stripFileExtension(fileName),
    meta: "Additional upload",
    createdAt: row.created_at,
    fileName,
  };
}

function buildDefaultSubtitle(template: BrochureTemplate, projectName: string) {
  switch (template) {
    case "minimal":
      return `${projectName} presented through a calm, editorial brochure layout.`;
    case "luxury":
      return `${projectName} prepared as a premium sales brochure for presentation and marketing use.`;
    default:
      return `${projectName} organized into a clean brochure ready to share with clients and buyers.`;
  }
}

function buildDefaultBody(projectName: string) {
  return `${projectName} is presented here through a concise sequence of approved visuals, giving your team a brochure-ready document for sales, client meetings, and high-end project presentation.`;
}

function buildDefaultStyleSettings(): BrochureStyleSettings {
  return {
    fontFamily: "helvetica",
    orientation: "portrait",
    accentColor: DEFAULT_ACCENT_COLOR,
    backgroundColor: "#ffffff",
    logoUrl: null,
  };
}

function normalizeExperienceMode(
  value: string | null | undefined,
): BrochureExperienceMode {
  return value === "immersive" ? "immersive" : "brochure";
}

function normalizeImmersiveTheme(
  value: string | null | undefined,
): BrochureImmersiveTheme {
  return value === "dark" || value === "warm" || value === "editorial"
    ? value
    : "light";
}

function normalizeImmersiveMotionPreset(
  value: string | null | undefined,
): BrochureImmersiveMotionPreset {
  return value === "cinematic" || value === "bold" ? value : "soft";
}

function normalizeImmersiveVisualStyle(
  value: string | null | undefined,
): BrochureImmersiveVisualStyle {
  return value === "luxury-minimal" ||
    value === "warm-lifestyle"
    ? value
    : "modern-real-estate";
}

function normalizeImmersiveAnimationLevel(
  value: string | null | undefined,
): BrochureImmersiveAnimationLevel {
  return value === "minimal" || value === "cinematic" ? value : "subtle";
}

function normalizeImmersiveSectionKey(
  value: unknown,
): BrochureImmersiveSectionKey | null {
  return value === "hero" ||
    value === "gallery" ||
    value === "video" ||
    value === "key-points" ||
    value === "description" ||
    value === "location" ||
    value === "lifestyle" ||
    value === "cta"
    ? value
    : null;
}

function normalizeImmersiveVideoMode(
  value: string | null | undefined,
): BrochureImmersiveVideoMode {
  return value === "background" ? value : "section";
}

function normalizeImmersiveMediaAspect(
  value: unknown,
): BrochureImmersiveMediaAspect | undefined {
  if (value === "portrait" || value === "square" || value === "landscape") return value;
  return undefined;
}

function normalizeOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeLatitudeForSave(value: unknown) {
  const next = normalizeOptionalNumber(value);
  if (next === undefined) return undefined;
  return Math.min(85, Math.max(-85, next));
}

function normalizeLongitudeForSave(value: unknown) {
  const next = normalizeOptionalNumber(value);
  if (next === undefined) return undefined;
  return Math.min(180, Math.max(-180, next));
}

function normalizeZoomForSave(value: unknown, fallback: number) {
  const next = normalizeOptionalNumber(value);
  if (next === undefined) return fallback;
  return Math.max(1, Math.min(20, Math.round(next)));
}

function normalizeMapStyle(value: unknown) {
  return value === "minimalMono" ||
    value === "minimalWarm" ||
    value === "minimalBlue" ||
    value === "color" ||
    value === "dark"
    ? value
    : "minimalMono";
}

function buildDefaultImmersiveSettings(): BrochureImmersiveSettings {
  return {
    theme: "light",
    motionPreset: "soft",
    showProgressNav: true,
  };
}

function buildDefaultImmersiveBuilder(): BrochureImmersiveBuilder {
  return {
    selectedSections: ["hero", "description", "gallery", "location", "cta"],
    visualStyle: "modern-real-estate",
    animationLevel: "subtle",
    heroImageId: "",
    galleryImageIds: [],
    videoUrl: "",
    videoMode: "section",
    keyPointsTitle: "Key points",
    keyPoints: [],
    descriptionTitle: "Project overview",
    descriptionBody: "",
    locationTitle: "Location",
    locationAddress: "",
    locationLatitude: null,
    locationLongitude: null,
    locationZoom: 14,
    locationMapStyle: "minimalMono",
    locationNeighborhood: "",
    locationPoints: [],
    lifestyleTitle: "Lifestyle",
    lifestyleBody: "",
    ctaTitle: "Request the full dossier",
    ctaBody: "Access the complete brochure and move the discussion forward with clients and buyers.",
    ctaButtonLabel: "Download PDF",
  };
}

function normalizeImmersiveBuilder(
  value: unknown,
  availableImageIds: string[],
): BrochureImmersiveBuilder {
  const defaults = buildDefaultImmersiveBuilder();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const candidate = value as Record<string, unknown>;
  const availableSet = new Set(availableImageIds);
  const selectedSections = normalizeStringArray(candidate.selectedSections)
    .map((entry) => normalizeImmersiveSectionKey(entry))
    .filter((entry): entry is BrochureImmersiveSectionKey => Boolean(entry))
    .filter((entry, index, source) => source.indexOf(entry) === index);

  const galleryImageIds = normalizeStringArray(candidate.galleryImageIds).filter(
    (id, index, source) => availableSet.has(id) && source.indexOf(id) === index,
  );
  const heroImageId =
    typeof candidate.heroImageId === "string" && availableSet.has(candidate.heroImageId.trim())
      ? candidate.heroImageId.trim()
      : defaults.heroImageId;

  return {
    selectedSections: selectedSections.length > 0 ? selectedSections : defaults.selectedSections,
    visualStyle: normalizeImmersiveVisualStyle(
      typeof candidate.visualStyle === "string" ? candidate.visualStyle : null,
    ),
    animationLevel: normalizeImmersiveAnimationLevel(
      typeof candidate.animationLevel === "string" ? candidate.animationLevel : null,
    ),
    heroImageId,
    galleryImageIds,
    videoUrl: normalizeString(candidate.videoUrl),
    videoMode: normalizeImmersiveVideoMode(
      typeof candidate.videoMode === "string" ? candidate.videoMode : null,
    ),
    keyPointsTitle: normalizeOptionalString(candidate.keyPointsTitle) ?? defaults.keyPointsTitle,
    keyPoints: normalizeTrimmedStringArray(candidate.keyPoints),
    descriptionTitle:
      normalizeOptionalString(candidate.descriptionTitle) ?? defaults.descriptionTitle,
    descriptionBody: normalizeString(candidate.descriptionBody),
    locationTitle: normalizeOptionalString(candidate.locationTitle) ?? defaults.locationTitle,
    locationAddress: normalizeString(candidate.locationAddress),
    locationLatitude:
      normalizeLatitudeForSave(candidate.locationLatitude) ??
      normalizeLatitudeForSave(candidate.locationLat) ??
      null,
    locationLongitude:
      normalizeLongitudeForSave(candidate.locationLongitude) ??
      normalizeLongitudeForSave(candidate.locationLon) ??
      null,
    locationZoom: normalizeZoomForSave(candidate.locationZoom, defaults.locationZoom),
    locationMapStyle: normalizeMapStyle(candidate.locationMapStyle),
    locationNeighborhood: normalizeString(candidate.locationNeighborhood),
    locationPoints: normalizeTrimmedStringArray(candidate.locationPoints),
    lifestyleTitle:
      normalizeOptionalString(candidate.lifestyleTitle) ?? defaults.lifestyleTitle,
    lifestyleBody: normalizeString(candidate.lifestyleBody),
    ctaTitle: normalizeOptionalString(candidate.ctaTitle) ?? defaults.ctaTitle,
    ctaBody: normalizeOptionalString(candidate.ctaBody) ?? defaults.ctaBody,
    ctaButtonLabel:
      normalizeOptionalString(candidate.ctaButtonLabel) ?? defaults.ctaButtonLabel,
  };
}

function buildDefaultSections(
  projectName: string,
  title: string,
  subtitle: string,
  body: string,
  imageIds: string[],
): BrochureSection[] {
  const cover = createBrochureSection("cover");
  cover.title = title || projectName;
  cover.subtitle = subtitle;
  cover.body = body;
  cover.imageIds = imageIds.slice(0, 1);
  return [cover];
}

function sanitizeSectionImageIds(imageIds: unknown, availableImageIds: string[]) {
  const allowedIds = new Set(availableImageIds);
  return normalizeStringArray(imageIds).filter(
    (id, index, source) => allowedIds.has(id) && source.indexOf(id) === index,
  );
}

function sanitizeSocialLinks(value: unknown): BrochureSocialLinks | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = value as Record<string, unknown>;
  const links: BrochureSocialLinks = {};

  if (typeof candidate.website === "string" && candidate.website.trim()) {
    links.website = candidate.website.trim();
  }
  if (typeof candidate.instagram === "string" && candidate.instagram.trim()) {
    links.instagram = candidate.instagram.trim();
  }
  if (typeof candidate.linkedin === "string" && candidate.linkedin.trim()) {
    links.linkedin = candidate.linkedin.trim();
  }
  if (typeof candidate.facebook === "string" && candidate.facebook.trim()) {
    links.facebook = candidate.facebook.trim();
  }
  if (typeof candidate.x === "string" && candidate.x.trim()) {
    links.x = candidate.x.trim();
  }

  return normalizeSocialLinks(links);
}

function sanitizeSections(
  value: unknown,
  availableImageIds: string[],
  projectName: string,
  title: string,
  subtitle: string,
  body: string,
): BrochureSection[] {
  const fallbackSections = buildDefaultSections(
    projectName,
    title,
    subtitle,
    body,
    availableImageIds,
  );

  if (!Array.isArray(value)) {
    return fallbackSections;
  }

  const nextSections = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;

      const candidate = entry as Record<string, unknown>;
      const kind = normalizeSectionKind(candidate.kind);
      if (!kind) return null;

      const definition = getBrochureSectionDefinition(kind);
      const isBlankSection = kind === "blank";
      const titleValue = normalizeOptionalString(candidate.title);
      const subtitleValue = normalizeOptionalString(candidate.subtitle);
      const bodyValue = normalizeOptionalString(candidate.body);

      return {
        id: normalizeString(candidate.id) || crypto.randomUUID(),
        kind,
        title:
          isBlankSection
            ? titleValue ?? ""
            : titleValue ?? (kind === "cover" ? title : definition?.defaultTitle) ?? "Section",
        subtitle:
          isBlankSection
            ? subtitleValue ?? ""
            : subtitleValue ?? (kind === "cover" ? subtitle : definition?.defaultSubtitle) ?? "",
        body:
          isBlankSection
            ? bodyValue ?? ""
            : bodyValue ?? (kind === "cover" ? body : definition?.defaultBody) ?? "",
        imageIds: sanitizeSectionImageIds(candidate.imageIds, availableImageIds),
        layoutItems: sanitizeCanvasItems(kind, candidate.layoutItems, {
          availableImageIds,
        }),
        socialLinks:
          kind === "final"
            ? sanitizeSocialLinks(candidate.socialLinks)
            : undefined,
        isHidden: candidate.isHidden === true,
        immersiveVariant:
          candidate.immersiveVariant === "gallery" ||
          candidate.immersiveVariant === "video" ||
          candidate.immersiveVariant === "key-points" ||
          candidate.immersiveVariant === "location" ||
          candidate.immersiveVariant === "lifestyle" ||
          candidate.immersiveVariant === "cta"
            ? candidate.immersiveVariant
            : "standard",
        immersiveLayout:
          candidate.immersiveLayout === "media-right" ||
          candidate.immersiveLayout === "full-bleed"
            ? candidate.immersiveLayout
            : "media-left",
        immersiveMediaAspect: normalizeImmersiveMediaAspect(candidate.immersiveMediaAspect),
        immersiveMediaFocusX: normalizeOptionalNumber(candidate.immersiveMediaFocusX),
        immersiveMediaFocusY: normalizeOptionalNumber(candidate.immersiveMediaFocusY),
        immersiveKeyPoints: normalizeTrimmedStringArray(candidate.immersiveKeyPoints),
        immersiveVideoUrl: normalizeString(candidate.immersiveVideoUrl),
        immersiveVideoMode: normalizeImmersiveVideoMode(
          typeof candidate.immersiveVideoMode === "string"
            ? candidate.immersiveVideoMode
            : null,
        ),
        immersiveMapLatitude: normalizeLatitudeForSave(candidate.immersiveMapLatitude),
        immersiveMapLongitude: normalizeLongitudeForSave(candidate.immersiveMapLongitude),
        immersiveMapZoom: normalizeZoomForSave(candidate.immersiveMapZoom, 14),
        immersiveMapStyle: normalizeMapStyle(candidate.immersiveMapStyle),
      } satisfies BrochureSection;
    })
    .filter(Boolean) as BrochureSection[];

  if (nextSections.length === 0) {
    return fallbackSections;
  }

  if (!nextSections.some((section) => section.kind === "cover")) {
    nextSections.unshift(fallbackSections[0]);
  }

  return nextSections.map((section) => {
    if (section.kind !== "cover") {
      return {
        ...section,
        layoutItems: sanitizeCanvasItems(section.kind, section.layoutItems, {
          availableImageIds,
        }),
        title: section.title,
        isHidden: section.isHidden === true,
        immersiveVariant: section.immersiveVariant ?? "standard",
        immersiveLayout: section.immersiveLayout ?? "media-left",
        immersiveMediaAspect: section.immersiveMediaAspect,
        immersiveMediaFocusX: section.immersiveMediaFocusX,
        immersiveMediaFocusY: section.immersiveMediaFocusY,
        immersiveKeyPoints: section.immersiveKeyPoints ?? [],
        immersiveVideoUrl: section.immersiveVideoUrl ?? "",
        immersiveVideoMode: section.immersiveVideoMode ?? "section",
        immersiveMapLatitude: section.immersiveMapLatitude,
        immersiveMapLongitude: section.immersiveMapLongitude,
        immersiveMapZoom: section.immersiveMapZoom,
        immersiveMapStyle: section.immersiveMapStyle,
        socialLinks:
          section.kind === "final"
            ? normalizeSocialLinks(section.socialLinks)
            : undefined,
      };
    }

    return {
      ...section,
      title: section.title,
      subtitle: section.subtitle,
      body: section.body,
      imageIds: section.imageIds.length > 0 ? section.imageIds : availableImageIds.slice(0, 1),
      layoutItems: sanitizeCanvasItems(section.kind, section.layoutItems, {
        availableImageIds,
      }),
      isHidden: section.isHidden === true,
      immersiveVariant: section.immersiveVariant ?? "standard",
      immersiveLayout: section.immersiveLayout ?? "media-left",
      immersiveMediaAspect: section.immersiveMediaAspect,
      immersiveMediaFocusX: section.immersiveMediaFocusX,
      immersiveMediaFocusY: section.immersiveMediaFocusY,
      immersiveKeyPoints: section.immersiveKeyPoints ?? [],
      immersiveVideoUrl: section.immersiveVideoUrl ?? "",
      immersiveVideoMode: section.immersiveVideoMode ?? "section",
      immersiveMapLatitude: section.immersiveMapLatitude,
      immersiveMapLongitude: section.immersiveMapLongitude,
      immersiveMapZoom: section.immersiveMapZoom,
      immersiveMapStyle: section.immersiveMapStyle,
      socialLinks: undefined,
    };
  });
}

function buildDefaultContent(
  allImageIds: string[],
  projectName: string,
  title: string,
  subtitle: string,
  body: string,
): BrochureContent {
  return {
    imageOrder: allImageIds,
    selectedImageIds: allImageIds,
    sections: buildDefaultSections(projectName, title, subtitle, body, allImageIds),
    experienceMode: "brochure",
    immersiveSettings: buildDefaultImmersiveSettings(),
    immersiveBuilder: buildDefaultImmersiveBuilder(),
  };
}

function normalizeStyleSettings(value: unknown): BrochureStyleSettings {
  if (!value || typeof value !== "object") {
    return buildDefaultStyleSettings();
  }

  const candidate = value as Record<string, unknown>;

  return {
    fontFamily: normalizeFontFamily(
      typeof candidate.fontFamily === "string" ? candidate.fontFamily : null,
    ),
    orientation: normalizeOrientation(
      typeof candidate.orientation === "string" ? candidate.orientation : null,
    ),
    accentColor: normalizeColor(
      typeof candidate.accentColor === "string" ? candidate.accentColor : null,
      DEFAULT_ACCENT_COLOR,
    ),
    backgroundColor: normalizeColor(
      typeof candidate.backgroundColor === "string" ? candidate.backgroundColor : null,
      "#ffffff",
    ),
    logoUrl: normalizeString(candidate.logoUrl) || null,
  };
}

function normalizeContentJson(
  value: unknown,
  availableImageIds: string[],
  projectName: string,
  title: string,
  subtitle: string,
  body: string,
): BrochureContent {
  const contentCandidate =
    value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  const immersiveCandidate =
    contentCandidate?.immersiveSettings &&
    typeof contentCandidate.immersiveSettings === "object"
      ? (contentCandidate.immersiveSettings as Record<string, unknown>)
      : null;
  const experienceMode = normalizeExperienceMode(
    typeof contentCandidate?.experienceMode === "string"
      ? contentCandidate.experienceMode
      : null,
  );
  const immersiveSettings: BrochureImmersiveSettings = {
    ...buildDefaultImmersiveSettings(),
    theme: normalizeImmersiveTheme(
      typeof immersiveCandidate?.theme === "string" ? immersiveCandidate.theme : null,
    ),
    motionPreset: normalizeImmersiveMotionPreset(
      typeof immersiveCandidate?.motionPreset === "string"
        ? immersiveCandidate.motionPreset
        : null,
    ),
    showProgressNav:
      typeof immersiveCandidate?.showProgressNav === "boolean"
        ? immersiveCandidate.showProgressNav
        : buildDefaultImmersiveSettings().showProgressNav,
  };
  const availableSet = new Set(availableImageIds);
  const allOrderedIds = normalizeStringArray(
    contentCandidate?.imageOrder ?? null,
  ).filter((id, index, source) => availableSet.has(id) && source.indexOf(id) === index);

  const imageOrder = [...allOrderedIds];

  for (const imageId of availableImageIds) {
    if (!imageOrder.includes(imageId)) {
      imageOrder.push(imageId);
    }
  }

  const selectedFromValue = normalizeStringArray(
    contentCandidate?.selectedImageIds ?? null,
  ).filter((id) => imageOrder.includes(id));

  const selectedImageIds = selectedFromValue.length > 0
    ? imageOrder.filter((id) => selectedFromValue.includes(id))
    : [...imageOrder];
  const immersiveBuilder = normalizeImmersiveBuilder(
    contentCandidate?.immersiveBuilder ?? null,
    imageOrder,
  );

  const rawSections = contentCandidate?.sections ?? null;

  if (Array.isArray(rawSections)) {
    const legacyHero = rawSections.find(
      (section) =>
        section &&
        typeof section === "object" &&
        (section as Record<string, unknown>).type === "hero",
    ) as Record<string, unknown> | undefined;
    const legacyGallery = rawSections.find(
      (section) =>
        section &&
        typeof section === "object" &&
        (section as Record<string, unknown>).type === "gallery",
    ) as Record<string, unknown> | undefined;

    if (
      rawSections.some(
        (section) =>
          section &&
          typeof section === "object" &&
          typeof (section as Record<string, unknown>).kind === "string",
      )
    ) {
      const sections = sanitizeSections(
        rawSections,
        imageOrder,
        projectName,
        title,
        subtitle,
        body,
      );
      const usedImageIds = new Set(sections.flatMap((section) => section.imageIds));

      return {
        imageOrder,
        selectedImageIds:
          selectedFromValue.length > 0
            ? imageOrder.filter((id) => selectedFromValue.includes(id) || usedImageIds.has(id))
            : imageOrder,
        sections,
        experienceMode,
        immersiveSettings,
        immersiveBuilder,
      };
    }

    if (legacyHero || legacyGallery) {
      const cover = createBrochureSection("cover");
      cover.title = title;
      cover.subtitle = subtitle;
      cover.body = body;
      cover.imageIds = sanitizeSectionImageIds(
        legacyHero ? [(legacyHero.imageId as string | null) ?? ""] : [],
        imageOrder,
      );

      const sections: BrochureSection[] = [cover];
      const galleryIds = sanitizeSectionImageIds(legacyGallery?.imageIds, imageOrder);

      if (galleryIds.length > 0) {
        const interiors = createBrochureSection("interiors");
        interiors.imageIds = galleryIds;
        sections.push(interiors);
      }

      return {
        imageOrder,
        selectedImageIds: selectedImageIds.length > 0 ? selectedImageIds : imageOrder,
        sections,
        experienceMode,
        immersiveSettings,
        immersiveBuilder,
      };
    }
  }

  return {
    imageOrder,
    selectedImageIds,
    sections: buildDefaultSections(projectName, title, subtitle, body, imageOrder),
    experienceMode,
    immersiveSettings,
    immersiveBuilder,
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

async function listBrochureAssetRows(projectId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brochure_assets")
    .select("id, project_id, kind, url, file_name, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingBrochureTableError(error)) {
      throw buildBrochureSetupError();
    }
    throw error;
  }

  return (data as BrochureAssetRow[] | null) ?? [];
}

async function ensureBrochureRowsForProjects(
  projects: ProjectRow[],
  approvedImages: ImageRow[],
) {
  const approvedProjectIds = [...new Set(approvedImages.map((image) => image.project_id))];
  if (approvedProjectIds.length === 0) {
    return new Map<string, BrochureRow>();
  }

  const supabase = getSupabaseAdminClient();
  const { data: brochuresData, error: brochuresError } = await supabase
    .from("brochures")
    .select(BROCHURE_SELECT)
    .in("project_id", approvedProjectIds);

  if (brochuresError) {
    if (isMissingBrochureTableError(brochuresError)) {
      throw buildBrochureSetupError();
    }
    throw brochuresError;
  }

  const brochureRows = (brochuresData as BrochureRow[] | null) ?? [];
  const brochureMap = new Map(brochureRows.map((row) => [row.project_id, row]));
  const approvedImagesByProject = new Map<string, ImageRow[]>();

  for (const image of approvedImages) {
    const projectImages = approvedImagesByProject.get(image.project_id) ?? [];
    projectImages.push(image);
    approvedImagesByProject.set(image.project_id, projectImages);
  }

  const rowsToInsert = projects
    .filter((project) => approvedProjectIds.includes(project.id) && !brochureMap.has(project.id))
    .map((project) => {
      const projectImages = approvedImagesByProject.get(project.id) ?? [];
      const canonicalImageIds = projectImages.map((image) => canonicalApprovedImageId(image.id));
      const template: BrochureTemplate = "modern";
      const body = buildDefaultBody(project.name);

      return {
        project_id: project.id,
        user_id: null,
        title: project.name,
        subtitle: buildDefaultSubtitle(template, project.name),
        body,
        template,
        style_settings: buildDefaultStyleSettings(),
        content_json: buildDefaultContent(
          canonicalImageIds,
          project.name,
          project.name,
          buildDefaultSubtitle(template, project.name),
          body,
        ),
      };
    });

  if (rowsToInsert.length === 0) {
    return brochureMap;
  }

  const { error: insertError } = await supabase.from("brochures").upsert(rowsToInsert, {
    onConflict: "project_id",
  });

  if (insertError) {
    if (isMissingBrochureTableError(insertError)) {
      throw buildBrochureSetupError();
    }
    throw insertError;
  }

  const { data: refreshedData, error: refreshedError } = await supabase
    .from("brochures")
    .select(BROCHURE_SELECT)
    .in("project_id", approvedProjectIds);

  if (refreshedError) {
    if (isMissingBrochureTableError(refreshedError)) {
      throw buildBrochureSetupError();
    }
    throw refreshedError;
  }

  return new Map(
    ((refreshedData as BrochureRow[] | null) ?? []).map((row) => [row.project_id, row]),
  );
}

async function resolveBrochureRow(identifier: string) {
  const supabase = getSupabaseAdminClient();

  const { data: byBrochureId, error: byBrochureIdError } = await supabase
    .from("brochures")
    .select(BROCHURE_SELECT)
    .eq("id", identifier)
    .maybeSingle();

  if (byBrochureIdError) {
    if (isMissingBrochureTableError(byBrochureIdError)) {
      throw buildBrochureSetupError();
    }
    throw byBrochureIdError;
  }

  if (byBrochureId) {
    return byBrochureId as BrochureRow;
  }

  const { data: byProjectId, error: byProjectIdError } = await supabase
    .from("brochures")
    .select(BROCHURE_SELECT)
    .eq("project_id", identifier)
    .maybeSingle();

  if (byProjectIdError) {
    if (isMissingBrochureTableError(byProjectIdError)) {
      throw buildBrochureSetupError();
    }
    throw byProjectIdError;
  }

  return (byProjectId as BrochureRow | null) ?? null;
}

async function ensureBrochureRowForProject(project: ProjectRow, approvedImages: ImageRow[]) {
  const existing = await resolveBrochureRow(project.id);
  if (existing) {
    return existing;
  }

  const supabase = getSupabaseAdminClient();
  const canonicalImageIds = approvedImages.map((image) => canonicalApprovedImageId(image.id));
  const template: BrochureTemplate = "modern";
  const body = buildDefaultBody(project.name);

  const { data, error } = await supabase
    .from("brochures")
    .upsert(
      {
        project_id: project.id,
        user_id: null,
        title: project.name,
        subtitle: buildDefaultSubtitle(template, project.name),
        body,
        template,
        style_settings: buildDefaultStyleSettings(),
        content_json: buildDefaultContent(
          canonicalImageIds,
          project.name,
          project.name,
          buildDefaultSubtitle(template, project.name),
          body,
        ),
      },
      {
        onConflict: "project_id",
      },
    )
    .select(BROCHURE_SELECT)
    .single();

  if (error) {
    if (isMissingBrochureTableError(error)) {
      throw buildBrochureSetupError();
    }
    throw error;
  }

  return data as BrochureRow;
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
  const brochureMap = await ensureBrochureRowsForProjects(projects, approvedImages);
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
      projectId: project.id,
      brochureId: brochureMap.get(project.id)?.id ?? null,
      name: project.name,
      createdAt: project.created_at,
      updatedAt: brochureMap.get(project.id)?.updated_at ?? null,
      coverImageUrl: coverImageUrlByProject.get(project.id) ?? null,
      approvedImageCount: imageCountByProject.get(project.id) ?? 0,
      latestApprovedVersion: latestVersionByProject.get(project.id) ?? 0,
    }));
}

export async function getBrochureProject(
  identifier: string,
): Promise<BrochureProject | null> {
  if (!isBrochureConfigured()) return null;

  const supabase = getSupabaseAdminClient();
  let brochureRow = await resolveBrochureRow(identifier);
  const projectId = brochureRow?.project_id ?? identifier;

  const [{ data: projectData, error: projectError }, approvedImageRows] =
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

  if (!brochureRow) {
    brochureRow = await ensureBrochureRowForProject(project, approvedImageRows);
  }

  const assetRows = await listBrochureAssetRows(project.id);
  const approvedImages = approvedImageRows.map(buildApprovedImage);
  const extraAssets = assetRows
    .filter((asset) => asset.kind === "extra" || asset.kind === null)
    .map(buildExtraAsset);
  const allImages = [...approvedImages, ...extraAssets];
  const template = normalizeTemplate(brochureRow.template);
  const title = brochureRow.title != null ? brochureRow.title.trim() : project.name;
  const subtitle =
    brochureRow.subtitle != null
      ? brochureRow.subtitle.trim()
      : buildDefaultSubtitle(template, project.name);
  const body =
    brochureRow.body != null ? brochureRow.body.trim() : buildDefaultBody(project.name);
  const styleSettings = normalizeStyleSettings(brochureRow.style_settings);
  const content = normalizeContentJson(
    brochureRow.content_json,
    allImages.map((image) => image.id),
    project.name,
    title,
    subtitle,
    body,
  );
  const latestApprovedVersion = approvedImages.reduce(
    (max, image) => Math.max(max, image.version),
    0,
  );

  return {
    projectId: project.id,
    brochureId: brochureRow.id,
    name: project.name,
    createdAt: project.created_at,
    updatedAt: brochureRow.updated_at,
    coverImageUrl: approvedImages[0]?.url ?? extraAssets[0]?.url ?? null,
    approvedImageCount: approvedImages.length,
    latestApprovedVersion,
    template,
    title,
    subtitle,
    body,
    styleSettings,
    content,
    experienceMode: content.experienceMode ?? "brochure",
    immersiveSettings: content.immersiveSettings ?? buildDefaultImmersiveSettings(),
    approvedImages,
    extraAssets,
  };
}

function normalizeImageIdsForSave(imageIds: string[] | undefined, availableIds: string[]) {
  if (!Array.isArray(imageIds)) return [];

  const allowedIds = new Set(availableIds);
  return imageIds.filter((id, index, source) => allowedIds.has(id) && source.indexOf(id) === index);
}

export async function saveBrochureSettings(
  identifier: string,
  input: {
    template?: BrochureTemplate;
    title?: string;
    subtitle?: string;
    body?: string;
    experienceMode?: BrochureExperienceMode;
    immersiveSettings?: Partial<BrochureImmersiveSettings>;
    fontFamily?: BrochureFontFamily;
    orientation?: BrochureOrientation;
    accentColor?: string;
    backgroundColor?: string;
    imageOrder?: string[];
    selectedImageIds?: string[];
    sections?: BrochureSection[];
    immersiveBuilder?: BrochureImmersiveBuilder;
  },
) {
  const project = await getBrochureProject(identifier);
  if (!project) throw new Error("Project not found.");

  const allImageIds = [...project.approvedImages, ...project.extraAssets].map((image) => image.id);
  const template = normalizeTemplate(input.template ?? project.template);
  const imageOrder = normalizeImageIdsForSave(
    input.imageOrder ?? project.content.imageOrder,
    allImageIds,
  );
  const fallbackImageOrder = imageOrder.length > 0 ? imageOrder : allImageIds;
  const draftTitle = input.title !== undefined ? input.title.trim() : project.title;
  const draftSubtitle =
    input.subtitle !== undefined ? input.subtitle.trim() : project.subtitle;
  const draftBody = input.body !== undefined ? input.body.trim() : project.body;
  const sections = sanitizeSections(
    input.sections ?? project.content.sections,
    fallbackImageOrder,
    project.name,
    draftTitle,
    draftSubtitle,
    draftBody,
  );
  const coverSection = sections.find((section) => section.kind === "cover") ?? sections[0];
  const title = coverSection?.title?.trim() ?? draftTitle;
  const subtitle = coverSection?.subtitle?.trim() ?? draftSubtitle;
  const body = coverSection?.body?.trim() ?? draftBody;
  const selectedBySections = new Set(sections.flatMap((section) => section.imageIds));
  const selectedImageIds = normalizeImageIdsForSave(
    input.selectedImageIds ??
      (selectedBySections.size > 0 ? [...selectedBySections] : project.content.selectedImageIds),
    fallbackImageOrder,
  );
  const finalSelectedImageIds =
    selectedImageIds.length > 0 ? selectedImageIds : [...fallbackImageOrder];
  const experienceMode = normalizeExperienceMode(
    input.experienceMode ?? project.experienceMode,
  );
  const immersiveSettings: BrochureImmersiveSettings = {
    ...buildDefaultImmersiveSettings(),
    ...project.immersiveSettings,
    ...(input.immersiveSettings ?? {}),
    theme: normalizeImmersiveTheme(
      input.immersiveSettings?.theme ?? project.immersiveSettings.theme,
    ),
    motionPreset: normalizeImmersiveMotionPreset(
      input.immersiveSettings?.motionPreset ?? project.immersiveSettings.motionPreset,
    ),
    showProgressNav:
      input.immersiveSettings?.showProgressNav ?? project.immersiveSettings.showProgressNav,
  };

  const content = {
    imageOrder: fallbackImageOrder,
    selectedImageIds: finalSelectedImageIds,
    sections,
    experienceMode,
    immersiveSettings,
    immersiveBuilder: normalizeImmersiveBuilder(
      input.immersiveBuilder ?? project.content.immersiveBuilder,
      fallbackImageOrder,
    ),
  } satisfies BrochureContent;

  const styleSettings: BrochureStyleSettings = {
    ...project.styleSettings,
    fontFamily: normalizeFontFamily(input.fontFamily ?? project.styleSettings.fontFamily),
    orientation: normalizeOrientation(
      input.orientation ?? project.styleSettings.orientation,
    ),
    accentColor: normalizeColor(
      input.accentColor ?? project.styleSettings.accentColor,
      DEFAULT_ACCENT_COLOR,
    ),
    backgroundColor: normalizeColor(
      input.backgroundColor ?? project.styleSettings.backgroundColor,
      "#ffffff",
    ),
  };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("brochures")
    .update({
      title,
      subtitle,
      body,
      template,
      style_settings: styleSettings,
      content_json: content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.brochureId);

  if (error) {
    if (isMissingBrochureTableError(error)) {
      throw buildBrochureSetupError();
    }
    throw error;
  }

  const nextProject = await getBrochureProject(project.brochureId);
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

export async function uploadBrochureLogo(identifier: string, file: File) {
  const project = await getBrochureProject(identifier);
  if (!project) throw new Error("Project not found.");

  const nextLogoUrl = await uploadBrochureFile(project.projectId, file, "logo");
  const previousLogoUrl = project.styleSettings.logoUrl;
  const styleSettings = {
    ...project.styleSettings,
    logoUrl: nextLogoUrl,
  } satisfies BrochureStyleSettings;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("brochures")
    .update({
      style_settings: styleSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.brochureId);

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

  const nextProject = await getBrochureProject(project.brochureId);
  if (!nextProject) throw new Error("Project not found.");
  return nextProject;
}

export async function deleteBrochureLogo(identifier: string) {
  const project = await getBrochureProject(identifier);
  if (!project) throw new Error("Project not found.");

  const previousLogoUrl = project.styleSettings.logoUrl;
  const styleSettings = {
    ...project.styleSettings,
    logoUrl: null,
  } satisfies BrochureStyleSettings;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("brochures")
    .update({
      style_settings: styleSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.brochureId);

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
      console.warn("Failed to remove brochure logo:", removeError.message);
    }
  }

  const nextProject = await getBrochureProject(project.brochureId);
  if (!nextProject) throw new Error("Project not found.");
  return nextProject;
}

export async function uploadBrochureAssets(identifier: string, files: File[]) {
  if (files.length === 0) throw new Error("Select at least one image.");

  const project = await getBrochureProject(identifier);
  if (!project) throw new Error("Project not found.");

  const supabase = getSupabaseAdminClient();
  const rowsToInsert: Array<{
    project_id: string;
    kind: "extra";
    url: string;
    file_name: string;
  }> = [];

  for (const file of files) {
    const publicUrl = await uploadBrochureFile(project.projectId, file, "extra");
    rowsToInsert.push({
      project_id: project.projectId,
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

  const nextProject = await getBrochureProject(project.brochureId);
  if (!nextProject) throw new Error("Project not found.");

  const mergedImageOrder = [...nextProject.content.imageOrder];
  const mergedSelectedImageIds = [...nextProject.content.selectedImageIds];

  for (const image of nextProject.extraAssets) {
    if (!mergedImageOrder.includes(image.id)) {
      mergedImageOrder.push(image.id);
    }
    if (!mergedSelectedImageIds.includes(image.id)) {
      mergedSelectedImageIds.push(image.id);
    }
  }

  return saveBrochureSettings(nextProject.brochureId, {
    imageOrder: mergedImageOrder,
    selectedImageIds: mergedSelectedImageIds,
  });
}

export async function deleteBrochureAsset(identifier: string, assetId: string) {
  const project = await getBrochureProject(identifier);
  if (!project) throw new Error("Project not found.");

  const targetAsset = project.extraAssets.find(
    (asset) => asset.id === assetId || asset.refId === assetId,
  );
  if (!targetAsset) {
    throw new Error("Image not found.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("brochure_assets")
    .delete()
    .eq("id", targetAsset.refId)
    .eq("project_id", project.projectId);

  if (error) {
    if (isMissingBrochureTableError(error)) {
      throw buildBrochureSetupError();
    }
    throw error;
  }

  const storagePath = getStoragePathFromPublicUrl(targetAsset.url);
  if (storagePath) {
    const { error: removeError } = await supabase.storage
      .from(BROCHURE_ASSET_BUCKET)
      .remove([storagePath]);

    if (removeError) {
      console.warn("Failed to remove brochure asset:", removeError.message);
    }
  }

  const cleanedImageOrder = project.content.imageOrder.filter((id) => id !== targetAsset.id);
  const cleanedSelectedImageIds = project.content.selectedImageIds.filter(
    (id) => id !== targetAsset.id,
  );
  const cleanedSections = project.content.sections.map((section) => ({
    ...section,
    imageIds: section.imageIds.filter((id) => id !== targetAsset.id),
    layoutItems: section.layoutItems.filter(
      (item) => item.kind !== "photo" || item.imageId !== targetAsset.id,
    ),
  }));

  return saveBrochureSettings(project.brochureId, {
    imageOrder: cleanedImageOrder,
    selectedImageIds: cleanedSelectedImageIds,
    sections: cleanedSections,
  });
}

export async function updateBrochureProjectStatus(
  identifier: string,
  status: ProjectStatus,
) {
  const project = await getBrochureProject(identifier);
  if (!project) throw new Error("Project not found.");

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", project.projectId);

  if (error) throw error;

  return getBrochureProject(project.brochureId);
}
