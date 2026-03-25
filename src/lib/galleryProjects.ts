export const PROJECT_OPTIONS = [
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

export function isGalleryProjectKey(value: unknown): value is GalleryProjectKey {
  return PROJECT_OPTIONS.some((option) => option.key === value);
}

export function normalizeGalleryProject(value: unknown): GalleryProjectKey {
  return isGalleryProjectKey(value) ? value : DEFAULT_GALLERY_PROJECT;
}

export function normalizeOptionalGalleryProject(value: unknown): GalleryProjectValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return isGalleryProjectKey(value) ? value : null;
}

export function getGalleryProjectLabel(project: GalleryProjectValue) {
  if (project === null) return null;
  return PROJECT_OPTIONS.find((option) => option.key === project)?.label ?? "Others";
}
