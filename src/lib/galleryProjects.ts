export const PROJECT_OPTIONS = [
  { key: "mesange", label: "Mésange" },
  { key: "jolimont", label: "Jolimont" },
  { key: "markham", label: "Markham" },
  { key: "markham-2", label: "Markham 2" },
  { key: "violette", label: "Violette" },
  { key: "cfoc", label: "CFOC" },
  { key: "others", label: "Others" },
] as const;

export type GalleryProjectKey = (typeof PROJECT_OPTIONS)[number]["key"];

export const DEFAULT_GALLERY_PROJECT: GalleryProjectKey = "others";

export function isGalleryProjectKey(value: unknown): value is GalleryProjectKey {
  return PROJECT_OPTIONS.some((option) => option.key === value);
}

export function normalizeGalleryProject(value: unknown): GalleryProjectKey {
  return isGalleryProjectKey(value) ? value : DEFAULT_GALLERY_PROJECT;
}

export function getGalleryProjectLabel(project: GalleryProjectKey) {
  return PROJECT_OPTIONS.find((option) => option.key === project)?.label ?? "Others";
}
