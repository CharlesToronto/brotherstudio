export const PROJECT_OPTIONS = [
  { key: "flanthey", label: "Flanthey" },
  { key: "arbaz", label: "Arbaz" },
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
  if (typeof value !== "string") return value;

  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveGalleryProjectKey(value: unknown): GalleryProjectKey | null {
  const normalizedValue = normalizeGalleryProjectCandidate(value);
  if (typeof normalizedValue !== "string" || normalizedValue.length === 0) {
    return null;
  }

  const match = PROJECT_OPTIONS.find((option) => {
    const normalizedKey = normalizeGalleryProjectCandidate(option.key);
    const normalizedLabel = normalizeGalleryProjectCandidate(option.label);
    return normalizedValue === normalizedKey || normalizedValue === normalizedLabel;
  });

  return match?.key ?? null;
}

export function isGalleryProjectKey(value: unknown): value is GalleryProjectKey {
  return resolveGalleryProjectKey(value) !== null;
}

export function normalizeGalleryProject(value: unknown): GalleryProjectKey {
  return resolveGalleryProjectKey(value) ?? DEFAULT_GALLERY_PROJECT;
}

export function normalizeOptionalGalleryProject(value: unknown): GalleryProjectValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return resolveGalleryProjectKey(value);
}

export function getGalleryProjectLabel(project: GalleryProjectValue) {
  if (project === null) return null;
  return PROJECT_OPTIONS.find((option) => option.key === project)?.label ?? "Others";
}
