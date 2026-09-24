export type ProjectImageAdjustments = {
  temperature: number;
  tint: number;
  brightness: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  saturation: number;
  vibrance: number;
  sharpness: number;
  clarity: number;
  vignette: number;
  invert: boolean;
};

export const defaultProjectImageAdjustments: ProjectImageAdjustments = {
  temperature: 0,
  tint: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  saturation: 0,
  vibrance: 0,
  sharpness: 0,
  clarity: 0,
  vignette: 0,
  invert: false,
};

const numericAdjustmentKeys = [
  "temperature",
  "tint",
  "brightness",
  "contrast",
  "highlights",
  "shadows",
  "whites",
  "blacks",
  "saturation",
  "vibrance",
  "sharpness",
  "clarity",
  "vignette",
] as const satisfies ReadonlyArray<Exclude<keyof ProjectImageAdjustments, "invert">>;

function normalizeAdjustmentValue(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(-100, Math.round(parsed)));
}

export function normalizeProjectImageAdjustments(
  value: unknown,
): ProjectImageAdjustments {
  const source = value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
  const normalized = { ...defaultProjectImageAdjustments };

  for (const key of numericAdjustmentKeys) {
    normalized[key] = normalizeAdjustmentValue(source[key]);
  }

  normalized.invert = source.invert === true;
  return normalized;
}
