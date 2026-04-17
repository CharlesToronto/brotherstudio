import type {
  BrochureCanvasItem,
  BrochureCanvasItemKind,
  BrochureCanvasShapeType,
  BrochureSectionKind,
  BrochureCanvasTextAlign,
  BrochureSocialLinkKey,
  BrochureSocialLinks,
} from "@/lib/brochureTypes";

export const BROCHURE_ARTBOARD_RATIO = 210 / 297;

export const BROCHURE_SOCIAL_LINK_KEYS: BrochureSocialLinkKey[] = [
  "website",
  "instagram",
  "linkedin",
  "facebook",
  "x",
];

type CanvasItemSeed = Omit<BrochureCanvasItem, "id">;

const STANDARD_LAYOUT_SEEDS: CanvasItemSeed[] = [
  {
    kind: "copy",
    x: 0.08,
    y: 0.10,
    width: 0.30,
    height: 0.26,
    zIndex: 3,
  },
  {
    kind: "media",
    x: 0.42,
    y: 0.11,
    width: 0.50,
    height: 0.56,
    zIndex: 2,
  },
];

const SECTION_LAYOUT_SEEDS: Record<BrochureSectionKind, CanvasItemSeed[]> = {
  cover: [
    {
      kind: "projectMeta",
      x: 0.06,
      y: 0.05,
      width: 0.34,
      height: 0.08,
      zIndex: 3,
    },
    {
      kind: "copy",
      x: 0.08,
      y: 0.19,
      width: 0.34,
      height: 0.26,
      zIndex: 4,
    },
    {
      kind: "media",
      x: 0.45,
      y: 0.12,
      width: 0.47,
      height: 0.56,
      zIndex: 2,
    },
    {
      kind: "logo",
      x: 0.74,
      y: 0.05,
      width: 0.18,
      height: 0.08,
      zIndex: 5,
    },
  ],
  introduction: STANDARD_LAYOUT_SEEDS,
  location: STANDARD_LAYOUT_SEEDS,
  architecture: STANDARD_LAYOUT_SEEDS,
  exteriors: STANDARD_LAYOUT_SEEDS,
  interiors: STANDARD_LAYOUT_SEEDS,
  plans: STANDARD_LAYOUT_SEEDS,
  typologies: STANDARD_LAYOUT_SEEDS,
  amenities: STANDARD_LAYOUT_SEEDS,
  advantages: STANDARD_LAYOUT_SEEDS,
  practical: STANDARD_LAYOUT_SEEDS,
  cta: STANDARD_LAYOUT_SEEDS,
  final: [
    {
      kind: "copy",
      x: 0.10,
      y: 0.18,
      width: 0.36,
      height: 0.20,
      zIndex: 3,
    },
    {
      kind: "socialLinks",
      x: 0.10,
      y: 0.56,
      width: 0.34,
      height: 0.18,
      zIndex: 4,
    },
    {
      kind: "logo",
      x: 0.70,
      y: 0.10,
      width: 0.20,
      height: 0.09,
      zIndex: 5,
    },
  ],
};

function cloneSeed(seed: CanvasItemSeed): BrochureCanvasItem {
  if (seed.kind === "shape") {
    return {
      ...seed,
      id: crypto.randomUUID(),
    } as BrochureCanvasItem;
  }

  return {
    ...seed,
    id: crypto.randomUUID(),
  } as BrochureCanvasItem;
}

function sortByLayer(items: BrochureCanvasItem[]) {
  return [...items].sort((left, right) => left.zIndex - right.zIndex);
}

function normalizeNumber(
  value: number,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeItemColor(value: unknown) {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)
    ? normalized
    : undefined;
}

function normalizeTextAlign(value: unknown): BrochureCanvasTextAlign {
  return value === "center" || value === "right" ? value : "left";
}

function normalizeStrokeWidth(value: unknown) {
  return Math.round(
    normalizeNumber(
      typeof value === "number" ? value : Number.NaN,
      3,
      1,
      16,
    ),
  );
}

export function createDefaultLayoutItemsForSection(
  kind: BrochureSectionKind,
): BrochureCanvasItem[] {
  return (SECTION_LAYOUT_SEEDS[kind] ?? STANDARD_LAYOUT_SEEDS).map((seed) =>
    cloneSeed(seed),
  );
}

export function createEmptySocialLinks(): BrochureSocialLinks {
  return {};
}

export function normalizeSocialLinks(
  links: BrochureSocialLinks | null | undefined,
): BrochureSocialLinks | undefined {
  if (!links) return undefined;

  const nextLinks: BrochureSocialLinks = {};

  for (const key of BROCHURE_SOCIAL_LINK_KEYS) {
    const value = typeof links[key] === "string" ? links[key]?.trim() : "";
    if (value) {
      nextLinks[key] = value;
    }
  }

  return Object.keys(nextLinks).length > 0 ? nextLinks : undefined;
}

export function hasSocialLinks(links: BrochureSocialLinks | null | undefined) {
  return Boolean(normalizeSocialLinks(links));
}

export function sanitizeCanvasItems(
  kind: BrochureSectionKind,
  items: unknown,
): BrochureCanvasItem[] {
  const seeds = createDefaultLayoutItemsForSection(kind);
  if (!Array.isArray(items)) {
    return seeds;
  }

  const requiredKinds = new Set(
    seeds
      .filter((item) => item.kind !== "shape" && item.kind !== "text")
      .map((item) => item.kind as Exclude<BrochureCanvasItemKind, "shape" | "text">),
  );
  const seenKinds = new Set<BrochureCanvasItemKind>();
  const nextItems: BrochureCanvasItem[] = [];

  for (const entry of items) {
    if (!entry || typeof entry !== "object") continue;

    const candidate = entry as Record<string, unknown>;
    const rawKind =
      typeof candidate.kind === "string" ? candidate.kind.trim() : "";
    const kindValue = (
      rawKind === "copy" ||
      rawKind === "media" ||
      rawKind === "logo" ||
      rawKind === "projectMeta" ||
      rawKind === "socialLinks" ||
      rawKind === "text" ||
      rawKind === "shape"
    )
      ? rawKind
      : null;

    if (!kindValue) continue;

    if (kindValue !== "shape" && kindValue !== "text") {
      if (!requiredKinds.has(kindValue)) continue;
      if (seenKinds.has(kindValue)) continue;
      seenKinds.add(kindValue);
    }

    const normalizedBase = {
      id:
        typeof candidate.id === "string" && candidate.id.trim().length > 0
          ? candidate.id.trim()
          : crypto.randomUUID(),
      x: normalizeNumber(
        typeof candidate.x === "number" ? candidate.x : Number.NaN,
        0.1,
        0,
        0.92,
      ),
      y: normalizeNumber(
        typeof candidate.y === "number" ? candidate.y : Number.NaN,
        0.1,
        0,
        0.92,
      ),
      width: normalizeNumber(
        typeof candidate.width === "number" ? candidate.width : Number.NaN,
        0.24,
        0.04,
        0.94,
      ),
      height: normalizeNumber(
        typeof candidate.height === "number" ? candidate.height : Number.NaN,
        0.14,
        0.04,
        0.94,
      ),
      zIndex: Math.max(
        1,
        Math.round(
          typeof candidate.zIndex === "number" ? candidate.zIndex : nextItems.length + 1,
        ),
      ),
      color: normalizeItemColor(candidate.color),
    };

    if (kindValue === "shape") {
      const shapeType =
        candidate.shapeType === "rectangle" ||
        candidate.shapeType === "square" ||
        candidate.shapeType === "circle" ||
        candidate.shapeType === "line" ||
        candidate.shapeType === "arrow"
          ? candidate.shapeType
          : null;

      if (!shapeType) continue;

      nextItems.push({
        ...normalizedBase,
        kind: "shape",
        shapeType,
        strokeWidth: normalizeStrokeWidth(candidate.strokeWidth),
      });
      continue;
    }

    if (kindValue === "text") {
      nextItems.push({
        ...normalizedBase,
        kind: "text",
        textContent:
          typeof candidate.textContent === "string" && candidate.textContent.trim().length > 0
            ? candidate.textContent
            : "New text block",
        textAlign: normalizeTextAlign(candidate.textAlign),
        fontSize: Math.round(
          normalizeNumber(
            typeof candidate.fontSize === "number" ? candidate.fontSize : Number.NaN,
            24,
            12,
            96,
          ),
        ),
        isBold: candidate.isBold === true,
        isItalic: candidate.isItalic === true,
      });
      continue;
    }

    nextItems.push({
      ...normalizedBase,
      kind: kindValue,
    });
  }

  const missingDefaults = seeds.filter(
    (seed) => !nextItems.some((item) => item.kind === seed.kind),
  );

  return normalizeCanvasItemLayers([
    ...nextItems,
    ...missingDefaults.map((seed) => cloneSeed(seed)),
  ]);
}

export function normalizeCanvasItemLayers(
  items: BrochureCanvasItem[],
): BrochureCanvasItem[] {
  return sortByLayer(items).map((item, index) => ({
    ...item,
    zIndex: index + 1,
  }));
}

export function getMaxCanvasLayer(items: BrochureCanvasItem[]) {
  return items.reduce((maximum, item) => Math.max(maximum, item.zIndex), 0);
}

export function createDecorativeShapeItem(
  shapeType: BrochureCanvasShapeType,
  zIndex: number,
): BrochureCanvasItem {
  const isLinear = shapeType === "line" || shapeType === "arrow";

  return {
    id: crypto.randomUUID(),
    kind: "shape",
    shapeType,
    x: 0.58,
    y: isLinear ? 0.18 : 0.16,
    width: isLinear ? 0.24 : 0.16,
    height: isLinear ? 0.025 : 0.12,
    zIndex,
    strokeWidth: 3,
  };
}

export function createCanvasTextItem(zIndex: number): BrochureCanvasItem {
  return {
    id: crypto.randomUUID(),
    kind: "text",
    textContent: "New text block",
    textAlign: "left",
    fontSize: 24,
    isBold: false,
    isItalic: false,
    x: 0.14,
    y: 0.16,
    width: 0.28,
    height: 0.14,
    zIndex,
  };
}

export function moveCanvasItemLayer(
  items: BrochureCanvasItem[],
  itemId: string,
  action: "forward" | "backward" | "front" | "back",
) {
  const orderedItems = sortByLayer(items);
  const currentIndex = orderedItems.findIndex((item) => item.id === itemId);
  if (currentIndex === -1) return orderedItems;

  const nextItems = [...orderedItems];
  const item = nextItems[currentIndex];
  if (!item) return orderedItems;

  if (action === "front") {
    nextItems.splice(currentIndex, 1);
    nextItems.push(item);
  } else if (action === "back") {
    nextItems.splice(currentIndex, 1);
    nextItems.unshift(item);
  } else {
    const nextIndex =
      action === "forward"
        ? Math.min(nextItems.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

    if (nextIndex === currentIndex) {
      return normalizeCanvasItemLayers(nextItems);
    }

    [nextItems[currentIndex], nextItems[nextIndex]] = [
      nextItems[nextIndex] as BrochureCanvasItem,
      nextItems[currentIndex] as BrochureCanvasItem,
    ];
  }

  return nextItems.map((entry, index) => ({
    ...entry,
    zIndex: index + 1,
  }));
}
