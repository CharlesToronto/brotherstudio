export const PROJECT_OPTIONS = [
  { key: "flanthey", label: "Flanthey" },
  { key: "come", label: "Come" },
  { key: "boe", label: "Boè" },
  { key: "mesange", label: "Mésange" },
  { key: "jolimont", label: "Jolimont" },
  { key: "markham", label: "Markham" },
  { key: "markham-2", label: "Markham 2" },
  { key: "violette", label: "Violette" },
  { key: "cfoc", label: "CFOC" },
  { key: "others", label: "Others" },
] as const;

export type GalleryProjectKey = (typeof PROJECT_OPTIONS)[number]["key"];
export type GalleryProjectValue = GalleryProjectKey | null;

export const DEFAULT_GALLERY_PROJECT: GalleryProjectKey = "others";

function normalizeGalleryProjectCandidate(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

export function isGalleryProjectKey(value: unknown): value is GalleryProjectKey {
  const normalizedValue = normalizeGalleryProjectCandidate(value);
  return PROJECT_OPTIONS.some((option) => option.key === normalizedValue);
}

export function normalizeGalleryProject(value: unknown): GalleryProjectKey {
  const normalizedValue = normalizeGalleryProjectCandidate(value);
  return isGalleryProjectKey(normalizedValue)
    ? normalizedValue
    : DEFAULT_GALLERY_PROJECT;
}

export function normalizeOptionalGalleryProject(value: unknown): GalleryProjectValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const normalizedValue = normalizeGalleryProjectCandidate(value);
  return isGalleryProjectKey(normalizedValue) ? normalizedValue : null;
}

export function getGalleryProjectLabel(project: GalleryProjectValue) {
  if (project === null) return null;
  return PROJECT_OPTIONS.find((option) => option.key === project)?.label ?? "Others";
}
