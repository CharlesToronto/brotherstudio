"use client";

/* eslint-disable @next/next/no-img-element */

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

import { BrochureMapCanvas } from "@/components/BrochureMapCanvas";
import { getBrochureSectionDefinition } from "@/lib/brochureSections";
import type {
  BrochureCanvasItem,
  BrochureCanvasTextAlign,
  BrochureFontFamily,
  BrochureImageItem,
  BrochureSection,
  BrochureStyleSettings,
  BrochureTemplate,
} from "@/lib/brochureTypes";
import type { BrochureDraggedImage } from "@/lib/unsplash";

type BrochurePreviewProps = {
  projectName: string;
  template: BrochureTemplate;
  styleSettings: BrochureStyleSettings;
  sections: BrochureSection[];
  images: BrochureImageItem[];
  editable?: boolean;
  activeSectionId?: string;
  onActiveSectionChange?: (sectionId: string) => void;
  onUpdateCanvasItem?: (
    sectionId: string,
    itemId: string,
    updater: (item: BrochureCanvasItem) => BrochureCanvasItem,
  ) => void;
  onUpdateCanvasItems?: (
    sectionId: string,
    updater: (items: BrochureCanvasItem[]) => BrochureCanvasItem[],
  ) => void;
  draggedImage?: BrochureDraggedImage | null;
  selectionPanelTarget?: HTMLElement | null;
  onSelectionStateChange?: (hasSelection: boolean) => void;
  onAddImageToCanvas?: (
    sectionId: string,
    image: BrochureDraggedImage,
  ) => Promise<string | null> | string | null;
  onDeleteCanvasItem?: (sectionId: string, itemId: string) => void;
  onMoveCanvasItemLayer?: (
    sectionId: string,
    itemId: string,
    action: "forward" | "backward" | "front" | "back",
  ) => void;
};

type SelectedCanvasItem = {
  sectionId: string;
  itemId: string;
};
type MapSearchSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
};
type ResizeHandle = "nw" | "ne" | "sw" | "se" | "start" | "end";

type InteractionState = {
  sectionId: string;
  itemId: string;
  mode: "move" | "resize";
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  startItem: BrochureCanvasItem;
  startItems: BrochureCanvasItem[];
  artboardWidth: number;
  artboardHeight: number;
};

const fontFamilyMap: Record<BrochureFontFamily, string> = {
  helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  garamond: 'Garamond, "Times New Roman", serif',
  georgia: 'Georgia, "Times New Roman", serif',
  times: '"Times New Roman", Times, serif',
};

const BOX_RESIZE_HANDLES: ResizeHandle[] = ["nw", "ne", "sw", "se"];
const LINEAR_RESIZE_HANDLES: ResizeHandle[] = ["start", "end"];
const BULLET_PREFIX_PATTERN = /^\s*(?:•|-)\s+/;
const NUMBER_PREFIX_PATTERN = /^\s*\d+\.\s+/;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getSelectedLineRange(
  value: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const safeStart = clamp(selectionStart, 0, value.length);
  const safeEnd = clamp(selectionEnd, safeStart, value.length);
  const lineStart = value.lastIndexOf("\n", Math.max(0, safeStart - 1)) + 1;
  const nextLineBreak = value.indexOf("\n", safeEnd);
  const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;

  return {
    lineStart,
    lineEnd,
    text: value.slice(lineStart, lineEnd),
  };
}

function stripListPrefix(line: string) {
  return line.replace(BULLET_PREFIX_PATTERN, "").replace(NUMBER_PREFIX_PATTERN, "");
}

function formatSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  style: "bullets" | "numbers",
) {
  const { lineStart, lineEnd, text } = getSelectedLineRange(
    value,
    selectionStart,
    selectionEnd,
  );
  const lines = text.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const shouldClearFormatting =
    nonEmptyLines.length > 0 &&
    nonEmptyLines.every((line) =>
      style === "bullets"
        ? BULLET_PREFIX_PATTERN.test(line)
        : NUMBER_PREFIX_PATTERN.test(line),
    );

  let visibleLineIndex = 1;
  const nextText = lines
    .map((line) => {
      if (!line.trim()) return line;

      const normalizedLine = stripListPrefix(line);
      if (shouldClearFormatting) {
        return normalizedLine;
      }

      if (style === "bullets") {
        return `• ${normalizedLine}`;
      }

      const numberedLine = `${visibleLineIndex}. ${normalizedLine}`;
      visibleLineIndex += 1;
      return numberedLine;
    })
    .join("\n");

  return {
    value: `${value.slice(0, lineStart)}${nextText}${value.slice(lineEnd)}`,
    selectionStart: lineStart,
    selectionEnd: lineStart + nextText.length,
  };
}

function buildPageStyle(styleSettings: BrochureStyleSettings) {
  return {
    "--brochure-font-family": fontFamilyMap[styleSettings.fontFamily],
    "--brochure-accent-color": styleSettings.accentColor,
    "--brochure-page-background": styleSettings.backgroundColor,
    "--brochure-page-ratio":
      styleSettings.orientation === "landscape" ? "297 / 210" : "210 / 297",
  } as CSSProperties;
}

function buildImageMap(images: BrochureImageItem[]) {
  return new Map(images.map((image) => [image.id, image]));
}

function getSortedCanvasItems(section: BrochureSection) {
  return [...section.layoutItems].sort((left, right) => left.zIndex - right.zIndex);
}

function getSectionImages(
  section: BrochureSection,
  imageMap: Map<string, BrochureImageItem>,
) {
  return section.imageIds
    .map((imageId) => imageMap.get(imageId))
    .filter((image): image is BrochureImageItem => Boolean(image));
}

function trimUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

function getSocialEntries(section: BrochureSection) {
  const links = section.socialLinks ?? {};

  return [
    links.website ? { key: "website", label: "Website", url: links.website } : null,
    links.instagram
      ? { key: "instagram", label: "Instagram", url: links.instagram }
      : null,
    links.linkedin ? { key: "linkedin", label: "LinkedIn", url: links.linkedin } : null,
    links.facebook ? { key: "facebook", label: "Facebook", url: links.facebook } : null,
    links.x ? { key: "x", label: "X", url: links.x } : null,
  ].filter(
    (
      entry,
    ): entry is {
      key: string;
      label: string;
      url: string;
    } => Boolean(entry),
  );
}

function isEditableItemVisible(
  item: BrochureCanvasItem,
  section: BrochureSection,
  styleSettings: BrochureStyleSettings,
  imageMap: Map<string, BrochureImageItem>,
  editable: boolean,
) {
  if (item.kind === "logo") {
    return editable || Boolean(styleSettings.logoUrl);
  }

  if (item.kind === "media") {
    return editable || getSectionImages(section, imageMap).length > 0;
  }

  if (item.kind === "photo") {
    return editable || imageMap.has(item.imageId);
  }

  if (item.kind === "socialLinks") {
    return editable || getSocialEntries(section).length > 0;
  }

  return true;
}

function getCanvasItemStyle(item: BrochureCanvasItem) {
  return {
    left: `${item.x * 100}%`,
    top: `${item.y * 100}%`,
    width: `${item.width * 100}%`,
    height: `${item.height * 100}%`,
    zIndex: item.zIndex,
    "--brochure-item-color": item.color ?? "var(--brochure-accent-color)",
    ...(item.kind === "text"
      ? {
          "--brochure-text-align": item.textAlign,
          "--brochure-text-size": `${item.fontSize}px`,
          "--brochure-text-font-weight": item.isBold ? "700" : "500",
          "--brochure-text-font-style": item.isItalic ? "italic" : "normal",
        }
      : {}),
    ...(item.kind === "shape"
      ? {
          "--brochure-shape-stroke-width": `${item.strokeWidth ?? 3}px`,
        }
      : {}),
  } as CSSProperties;
}

function canDeleteCanvasItem(item: BrochureCanvasItem) {
  return Boolean(item);
}

function nudgeCanvasItem(item: BrochureCanvasItem, deltaX: number, deltaY: number) {
  return {
    ...item,
    x: clamp(item.x + deltaX, 0, 1 - item.width),
    y: clamp(item.y + deltaY, 0, 1 - item.height),
  };
}

function getResolvedSelectedItems(
  sections: BrochureSection[],
  selectedItems: SelectedCanvasItem[],
) {
  const nextSelections: SelectedCanvasItem[] = [];

  for (const selectedItem of selectedItems) {
    const section = sections.find((entry) => entry.id === selectedItem.sectionId);
    if (!section) continue;
    if (!section.layoutItems.some((item) => item.id === selectedItem.itemId)) continue;
    nextSelections.push(selectedItem);
  }

  return nextSelections;
}

function getSelectedCanvasItem(
  sections: BrochureSection[],
  selectedItem: SelectedCanvasItem | null,
) {
  if (!selectedItem) return null;

  const section = sections.find((entry) => entry.id === selectedItem.sectionId);
  const item = section?.layoutItems.find((entry) => entry.id === selectedItem.itemId);
  if (!section || !item) return null;

  return {
    section,
    item,
  };
}

function clampGroupDelta(
  items: BrochureCanvasItem[],
  deltaX: number,
  deltaY: number,
) {
  const minDeltaX = Math.max(...items.map((item) => -item.x));
  const maxDeltaX = Math.min(...items.map((item) => 1 - item.x - item.width));
  const minDeltaY = Math.max(...items.map((item) => -item.y));
  const maxDeltaY = Math.min(...items.map((item) => 1 - item.y - item.height));

  return {
    deltaX: clamp(deltaX, minDeltaX, maxDeltaX),
    deltaY: clamp(deltaY, minDeltaY, maxDeltaY),
  };
}

function clampCanvasItem(
  item: BrochureCanvasItem,
  artboardWidth: number,
  artboardHeight: number,
) {
  const isLinearShape =
    item.kind === "shape" && (item.shapeType === "line" || item.shapeType === "arrow");
  const minimumWidth = item.kind === "shape" ? (isLinearShape ? 0.08 : 0.05) : 0.12;
  const minimumHeight = item.kind === "shape" ? (isLinearShape ? 0.012 : 0.05) : 0.08;
  let width = clamp(item.width, minimumWidth, 0.94);
  let height = clamp(item.height, minimumHeight, 0.94);

  if (
    item.kind === "shape" &&
    (item.shapeType === "square" || item.shapeType === "circle")
  ) {
    const widthPixels = width * artboardWidth;
    const heightPixels = height * artboardHeight;
    const sizePixels = Math.max(
      Math.min(widthPixels, heightPixels),
      Math.max(minimumWidth * artboardWidth, minimumHeight * artboardHeight),
    );
    width = sizePixels / artboardWidth;
    height = sizePixels / artboardHeight;
  }

  return {
    ...item,
    x: clamp(item.x, 0, 1 - width),
    y: clamp(item.y, 0, 1 - height),
    width,
    height,
  };
}

function resizeBoxItem(
  item: BrochureCanvasItem,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  artboardWidth: number,
  artboardHeight: number,
) {
  if (handle !== "nw" && handle !== "ne" && handle !== "sw" && handle !== "se") {
    return item;
  }

  const dx = deltaX / artboardWidth;
  const dy = deltaY / artboardHeight;
  const right = item.x + item.width;
  const bottom = item.y + item.height;

  let nextX = item.x;
  let nextY = item.y;
  let nextWidth = item.width;
  let nextHeight = item.height;

  if (handle.includes("w")) {
    nextX = item.x + dx;
    nextWidth = right - nextX;
  } else {
    nextWidth = item.width + dx;
  }

  if (handle.includes("n")) {
    nextY = item.y + dy;
    nextHeight = bottom - nextY;
  } else {
    nextHeight = item.height + dy;
  }

  const nextItem = clampCanvasItem(
    {
      ...item,
      x: nextX,
      y: nextY,
      width: nextWidth,
      height: nextHeight,
    },
    artboardWidth,
    artboardHeight,
  );

  if (
    item.kind === "shape" &&
    (item.shapeType === "square" || item.shapeType === "circle")
  ) {
    if (handle.includes("w")) {
      nextItem.x = right - nextItem.width;
    }
    if (handle.includes("n")) {
      nextItem.y = bottom - nextItem.height;
    }
  }

  return clampCanvasItem(nextItem, artboardWidth, artboardHeight);
}

function resizeLinearItem(
  item: BrochureCanvasItem,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  artboardWidth: number,
  artboardHeight: number,
) {
  if (handle !== "start" && handle !== "end") return item;

  const dx = deltaX / artboardWidth;
  const dy = deltaY / artboardHeight;
  const right = item.x + item.width;
  const bottom = item.y + item.height;

  const nextItem =
    handle === "start"
      ? {
          ...item,
          x: item.x + dx,
          y: item.y + dy,
          width: right - (item.x + dx),
          height: bottom - (item.y + dy),
        }
      : {
          ...item,
          width: item.width + dx,
          height: item.height + dy,
        };

  return clampCanvasItem(nextItem, artboardWidth, artboardHeight);
}

function renderMediaGrid(
  section: BrochureSection,
  imageMap: Map<string, BrochureImageItem>,
) {
  const sectionImages = getSectionImages(section, imageMap);

  if (sectionImages.length === 0) {
    return <div className="brochureCanvasPlaceholder">Assign images to this section.</div>;
  }

  return (
    <div
      className="brochureCanvasMediaGrid"
      data-count={String(Math.min(sectionImages.length, 4))}
    >
      {sectionImages.map((image) => (
        <figure key={image.id} className="brochureCanvasMediaFigure">
          <img src={image.url} alt={image.label} />
          <figcaption>
            <strong>{image.label}</strong>
            <span>{image.meta}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function renderPhotoItem(
  item: Extract<BrochureCanvasItem, { kind: "photo" }>,
  imageMap: Map<string, BrochureImageItem>,
  editable: boolean,
) {
  const image = imageMap.get(item.imageId);

  if (!image) {
    return editable ? (
      <div className="brochureCanvasPlaceholder">Drop an image here.</div>
    ) : null;
  }

  return (
    <div className="brochureCanvasPhoto">
      <img src={image.url} alt={image.label} />
    </div>
  );
}

function renderMapItem(
  item: Extract<BrochureCanvasItem, { kind: "map" }>,
  isSelected: boolean,
) {
  const hasAddress = item.address.trim().length > 0;

  if (!hasAddress) {
    return <div className="brochureCanvasPlaceholder">Add an address to display a map.</div>;
  }

  return (
    <div className="brochureCanvasMap">
      <div className="brochureCanvasMapFrame">
        <BrochureMapCanvas
          latitude={item.latitude}
          longitude={item.longitude}
          zoom={item.zoom}
          mapStyle={item.mapStyle ?? "minimalMono"}
          interactive={item.isInteractive !== false}
          capturePointerEvents={isSelected && item.isInteractive !== false}
        />
      </div>
      {item.showAddressLabel !== false ? (
        <p className="brochureCanvasMapLabel">{item.address}</p>
      ) : null}
      <p className="brochureCanvasMapAttribution">
        Map data © OpenStreetMap contributors, basemap © CARTO
      </p>
    </div>
  );
}

function renderShape(item: Extract<BrochureCanvasItem, { kind: "shape" }>) {
  const { shapeType } = item;

  if (shapeType === "line") {
    return (
      <svg
        className="brochureCanvasShapeSvg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line x1="6" y1="50" x2="94" y2="50" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }

  if (shapeType === "arrow") {
    return (
      <svg
        className="brochureCanvasShapeSvg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line x1="8" y1="50" x2="82" y2="50" vectorEffect="non-scaling-stroke" />
        <polyline
          points="66,36 82,50 66,64"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  return <div className="brochureCanvasShapeFill" data-shape={shapeType} />;
}

function renderCanvasItemContent(
  item: BrochureCanvasItem,
  section: BrochureSection,
  projectName: string,
  styleSettings: BrochureStyleSettings,
  imageMap: Map<string, BrochureImageItem>,
  editable: boolean,
  pageIndex: number,
  isSelected: boolean,
) {
  const label = getBrochureSectionDefinition(section.kind)?.label ?? "Section";

  if (item.kind === "projectMeta") {
    return (
      <div className="brochureCanvasMeta">
        <p className="brochureRenderEyebrow">BrotherStudio brochure</p>
        <p className="brochureRenderProjectName">{projectName}</p>
      </div>
    );
  }

  if (item.kind === "copy") {
    const TitleTag = section.kind === "cover" ? "h1" : "h2";
    const titleClass =
      section.kind === "cover" ? "brochureRenderTitle" : "brochureRenderSectionTitle";
    const subtitleClass =
      section.kind === "cover"
        ? "brochureRenderSubtitle"
        : "brochureRenderSectionSubtitle";
    const bodyClass =
      section.kind === "cover"
        ? "brochureRenderSectionBody brochureRenderSectionBodyLead"
        : "brochureRenderSectionBody";

    return (
      <div className="brochureCanvasCopy">
        <p className="brochureRenderSectionLabel">
          {String(pageIndex + 1).padStart(2, "0")} · {label}
        </p>
        <TitleTag className={titleClass}>{section.title}</TitleTag>
        {section.subtitle ? <p className={subtitleClass}>{section.subtitle}</p> : null}
        {section.body ? <p className={bodyClass}>{section.body}</p> : null}
      </div>
    );
  }

  if (item.kind === "media") {
    return renderMediaGrid(section, imageMap);
  }

  if (item.kind === "photo") {
    return renderPhotoItem(item, imageMap, editable);
  }

  if (item.kind === "map") {
    return renderMapItem(item, isSelected);
  }

  if (item.kind === "logo") {
    if (!styleSettings.logoUrl) {
      return editable ? (
        <div className="brochureCanvasPlaceholder">Upload a logo to place it here.</div>
      ) : null;
    }

    return (
      <div className="brochureCanvasLogo">
        <img src={styleSettings.logoUrl} alt={`${projectName} logo`} />
      </div>
    );
  }

  if (item.kind === "socialLinks") {
    const socialEntries = getSocialEntries(section);
    if (socialEntries.length === 0) {
      return editable ? (
        <div className="brochureCanvasPlaceholder">
          Add social links in the final section.
        </div>
      ) : null;
    }

    return (
      <div className="brochureCanvasSocial">
        <p className="brochureRenderSectionLabel">Social links</p>
        <div className="brochureCanvasSocialList">
          {socialEntries.map((entry) => (
            <a key={entry.key} href={entry.url} target="_blank" rel="noreferrer">
              <strong>{entry.label}</strong>
              <span>{trimUrl(entry.url)}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (item.kind === "text") {
    return (
      <div className="brochureCanvasTextBlock" data-align={item.textAlign}>
        <p className="brochureCanvasTextContent">
          {item.textContent || "New text block"}
        </p>
      </div>
    );
  }

  if (item.kind === "shape") {
    return <div className="brochureCanvasShape">{renderShape(item)}</div>;
  }

  return null;
}

export function BrochurePreview({
  projectName,
  template,
  styleSettings,
  sections,
  images,
  editable = false,
  activeSectionId,
  onActiveSectionChange,
  onUpdateCanvasItem,
  onUpdateCanvasItems,
  draggedImage,
  selectionPanelTarget,
  onSelectionStateChange,
  onAddImageToCanvas,
  onDeleteCanvasItem,
  onMoveCanvasItemLayer,
}: BrochurePreviewProps) {
  const imageMap = useMemo(() => buildImageMap(images), [images]);
  const artboardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const interactionRef = useRef<InteractionState | null>(null);
  const textEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedCanvasItem[]>([]);
  const [editingTextItem, setEditingTextItem] = useState<SelectedCanvasItem | null>(null);
  const [dropSectionId, setDropSectionId] = useState<string | null>(null);
  const [mapSuggestions, setMapSuggestions] = useState<MapSearchSuggestion[]>([]);
  const [mapSuggestionsQuery, setMapSuggestionsQuery] = useState("");
  const resolvedSelectedItems = editable
    ? getResolvedSelectedItems(sections, selectedItems)
    : [];
  const resolvedSelectedItem =
    resolvedSelectedItems[resolvedSelectedItems.length - 1] ?? null;
  const selectedCanvasItem = editable
    ? getSelectedCanvasItem(sections, resolvedSelectedItem)
    : null;
  const activeEditingTextItem =
    editable && editingTextItem
      ? getSelectedCanvasItem(sections, editingTextItem)
      : null;
  const activeEditingTextItemId =
    activeEditingTextItem?.item.kind === "text" ? activeEditingTextItem.item.id : null;

  useEffect(() => {
    if (!editable || (!onUpdateCanvasItem && !onUpdateCanvasItems)) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) return;

      const deltaX = event.clientX - interaction.startX;
      const deltaY = event.clientY - interaction.startY;

      if (interaction.mode === "move") {
        const nextDeltaX = deltaX / interaction.artboardWidth;
        const nextDeltaY = deltaY / interaction.artboardHeight;
        const clampedDelta = clampGroupDelta(
          interaction.startItems,
          nextDeltaX,
          nextDeltaY,
        );

        if (onUpdateCanvasItems) {
          const startItemsById = new Map(
            interaction.startItems.map((item) => [item.id, item]),
          );

          onUpdateCanvasItems(interaction.sectionId, (items) =>
            items.map((item) => {
              const startItem = startItemsById.get(item.id);
              if (!startItem) return item;

              return clampCanvasItem(
                {
                  ...item,
                  x: startItem.x + clampedDelta.deltaX,
                  y: startItem.y + clampedDelta.deltaY,
                },
                interaction.artboardWidth,
                interaction.artboardHeight,
              );
            }),
          );
          return;
        }

        onUpdateCanvasItem?.(interaction.sectionId, interaction.itemId, (item) =>
          clampCanvasItem(
            {
              ...item,
              x: interaction.startItem.x + clampedDelta.deltaX,
              y: interaction.startItem.y + clampedDelta.deltaY,
            },
            interaction.artboardWidth,
            interaction.artboardHeight,
          ),
        );
        return;
      }

      onUpdateCanvasItem?.(interaction.sectionId, interaction.itemId, (item) => {
        if (
          item.kind === "shape" &&
          (item.shapeType === "line" || item.shapeType === "arrow")
        ) {
          return resizeLinearItem(
            interaction.startItem,
            interaction.handle ?? "end",
            deltaX,
            deltaY,
            interaction.artboardWidth,
            interaction.artboardHeight,
          );
        }

        return resizeBoxItem(
          interaction.startItem,
          interaction.handle ?? "se",
          deltaX,
          deltaY,
          interaction.artboardWidth,
          interaction.artboardHeight,
        );
      });
    };

    const handlePointerUp = () => {
      if (!interactionRef.current) return;
      interactionRef.current = null;
      document.body.style.removeProperty("user-select");
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [editable, onUpdateCanvasItem, onUpdateCanvasItems]);

  useEffect(() => {
    if (!activeEditingTextItemId) return;

    const frameId = window.requestAnimationFrame(() => {
      textEditorRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeEditingTextItemId]);

  useEffect(() => {
    onSelectionStateChange?.(editable && Boolean(selectedCanvasItem));
  }, [editable, onSelectionStateChange, selectedCanvasItem]);

  useEffect(() => {
    return () => onSelectionStateChange?.(false);
  }, [onSelectionStateChange]);

  const setSingleSelection = (sectionId: string, itemId: string) => {
    setSelectedItems([{ sectionId, itemId }]);
  };

  const toggleSelection = (sectionId: string, itemId: string) => {
    setSelectedItems((current) => {
      const sameSectionSelections = current.filter(
        (selection) => selection.sectionId === sectionId,
      );

      if (sameSectionSelections.length !== current.length) {
        return [{ sectionId, itemId }];
      }

      const alreadySelected = sameSectionSelections.some(
        (selection) => selection.itemId === itemId,
      );

      if (alreadySelected) {
        const nextSelections = sameSectionSelections.filter(
          (selection) => selection.itemId !== itemId,
        );
        return nextSelections.length > 0 ? nextSelections : [{ sectionId, itemId }];
      }

      return [...sameSectionSelections, { sectionId, itemId }];
    });
  };

  const beginInteraction = (
    event: ReactPointerEvent<HTMLElement>,
    sectionId: string,
    item: BrochureCanvasItem,
    mode: "move" | "resize",
    handle?: ResizeHandle,
  ) => {
    if (!editable) return;
    if (mode === "move" && (event.shiftKey || event.metaKey || event.ctrlKey)) {
      return;
    }

    const artboard = artboardRefs.current[sectionId];
    if (!artboard) return;

    const artboardRect = artboard.getBoundingClientRect();
    if (artboardRect.width <= 0 || artboardRect.height <= 0) return;

    event.preventDefault();
    event.stopPropagation();

    const selectedItemIds = resolvedSelectedItems
      .filter((selection) => selection.sectionId === sectionId)
      .map((selection) => selection.itemId);
    const shouldMoveGroup =
      mode === "move" &&
      selectedItemIds.includes(item.id) &&
      selectedItemIds.length > 1;
    const startItems =
      shouldMoveGroup
        ? sections
            .find((section) => section.id === sectionId)
            ?.layoutItems.filter((entry) => selectedItemIds.includes(entry.id)) ?? [item]
        : [item];

    if (!selectedItemIds.includes(item.id) || !shouldMoveGroup) {
      setSingleSelection(sectionId, item.id);
    }

    setEditingTextItem(null);
    onActiveSectionChange?.(sectionId);
    interactionRef.current = {
      sectionId,
      itemId: item.id,
      mode,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startItem: item,
      startItems,
      artboardWidth: artboardRect.width,
      artboardHeight: artboardRect.height,
    };
    document.body.style.setProperty("user-select", "none");
  };

  const selectedIsText = selectedCanvasItem?.item.kind === "text";
  const selectedShapeItem =
    selectedCanvasItem?.item.kind === "shape" ? selectedCanvasItem.item : null;
  const selectedTextItem =
    selectedCanvasItem?.item.kind === "text" ? selectedCanvasItem.item : null;
  const selectedMapItem =
    selectedCanvasItem?.item.kind === "map" ? selectedCanvasItem.item : null;
  const deferredMapAddress = useDeferredValue(selectedMapItem?.address ?? "");
  const trimmedDeferredMapAddress = deferredMapAddress.trim();
  const canFetchMapSuggestions =
    Boolean(selectedMapItem) && trimmedDeferredMapAddress.length >= 3;
  const visibleMapSuggestions =
    canFetchMapSuggestions && mapSuggestionsQuery === trimmedDeferredMapAddress
      ? mapSuggestions
      : [];
  const selectedCount = resolvedSelectedItems.length;
  const selectedIdsInActiveSection = new Set(
    selectedCanvasItem
      ? resolvedSelectedItems
          .filter((selection) => selection.sectionId === selectedCanvasItem.section.id)
          .map((selection) => selection.itemId)
      : [],
  );
  const selectedCanDelete = selectedCanvasItem
    ? canDeleteCanvasItem(selectedCanvasItem.item)
    : false;
  const selectedItemColor =
    selectedCanvasItem?.item.color ?? styleSettings.accentColor;

  useEffect(() => {
    if (!canFetchMapSuggestions) return;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      void fetch(`/api/maps/search?q=${encodeURIComponent(trimmedDeferredMapAddress)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to load map suggestions.");
          }

          return response.json() as Promise<{ suggestions?: MapSearchSuggestion[] }>;
        })
        .then((payload) => {
          setMapSuggestions(payload.suggestions ?? []);
          setMapSuggestionsQuery(trimmedDeferredMapAddress);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          console.error(error);
          setMapSuggestions([]);
          setMapSuggestionsQuery(trimmedDeferredMapAddress);
        });
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [canFetchMapSuggestions, selectedMapItem, trimmedDeferredMapAddress]);

  const applySelectionUpdate = (
    updater: (item: BrochureCanvasItem) => BrochureCanvasItem,
  ) => {
    if (!selectedCanvasItem) return;

    if (onUpdateCanvasItems && selectedIdsInActiveSection.size > 1) {
      onUpdateCanvasItems(selectedCanvasItem.section.id, (items) =>
        items.map((item) =>
          selectedIdsInActiveSection.has(item.id) ? updater(item) : item,
        ),
      );
      return;
    }

    onUpdateCanvasItem?.(
      selectedCanvasItem.section.id,
      selectedCanvasItem.item.id,
      updater,
    );
  };

  const updateSelectedItemColor = (nextColor: string) => {
    applySelectionUpdate((item) => ({
      ...item,
      color: nextColor,
    }));
  };

  const updateSelectedTextItem = (
    updater: (item: Extract<BrochureCanvasItem, { kind: "text" }>) => BrochureCanvasItem,
  ) => {
    if (!selectedCanvasItem || selectedCanvasItem.item.kind !== "text" || !onUpdateCanvasItem) {
      return;
    }

    onUpdateCanvasItem(
      selectedCanvasItem.section.id,
      selectedCanvasItem.item.id,
      (item) =>
        item.kind === "text"
          ? updater(item)
          : item,
    );
  };

  const moveSelectedLayer = (action: "forward" | "backward" | "front" | "back") => {
    if (!selectedCanvasItem || !onMoveCanvasItemLayer) return;

    onMoveCanvasItemLayer(
      selectedCanvasItem.section.id,
      selectedCanvasItem.item.id,
      action,
    );
  };

  const nudgeSelected = (deltaX: number, deltaY: number) => {
    if (!selectedCanvasItem) return;

    if (onUpdateCanvasItems && selectedIdsInActiveSection.size > 1) {
      const selectedItemsForSection = selectedCanvasItem.section.layoutItems.filter((item) =>
        selectedIdsInActiveSection.has(item.id),
      );
      const clampedDelta = clampGroupDelta(
        selectedItemsForSection,
        deltaX,
        deltaY,
      );

      onUpdateCanvasItems(selectedCanvasItem.section.id, (items) =>
        items.map((item) =>
          selectedIdsInActiveSection.has(item.id)
            ? {
                ...item,
                x: item.x + clampedDelta.deltaX,
                y: item.y + clampedDelta.deltaY,
              }
            : item,
        ),
      );
      return;
    }

    onUpdateCanvasItem?.(
      selectedCanvasItem.section.id,
      selectedCanvasItem.item.id,
      (item) => nudgeCanvasItem(item, deltaX, deltaY),
    );
  };

  const deleteSelectedItem = () => {
    if (!selectedCanvasItem || !selectedCanDelete) return;

    if (onUpdateCanvasItems && selectedIdsInActiveSection.size > 1) {
      onUpdateCanvasItems(selectedCanvasItem.section.id, (items) =>
        items.filter((item) => !selectedIdsInActiveSection.has(item.id)),
      );
      setSelectedItems([]);
      setEditingTextItem(null);
      return;
    }

    onDeleteCanvasItem?.(selectedCanvasItem.section.id, selectedCanvasItem.item.id);
    setSelectedItems([]);
    setEditingTextItem(null);
  };

  const updateSelectedTextAlign = (textAlign: BrochureCanvasTextAlign) => {
    updateSelectedTextItem((item) => ({
      ...item,
      textAlign,
    }));
  };

  const updateSelectedTextContent = (textContent: string) => {
    updateSelectedTextItem((item) => ({
      ...item,
      textContent,
    }));
  };

  const updateSelectedMapItem = (
    updater: (item: Extract<BrochureCanvasItem, { kind: "map" }>) => BrochureCanvasItem,
  ) => {
    if (!selectedCanvasItem || selectedCanvasItem.item.kind !== "map" || !onUpdateCanvasItem) {
      return;
    }

    onUpdateCanvasItem(
      selectedCanvasItem.section.id,
      selectedCanvasItem.item.id,
      (item) => (item.kind === "map" ? updater(item) : item),
    );
  };

  const updateSelectedMapAddress = (address: string) => {
    if (address.trim().length < 3) {
      setMapSuggestions([]);
      setMapSuggestionsQuery("");
    }

    updateSelectedMapItem((item) => ({
      ...item,
      address,
    }));
  };

  const applySelectedMapSuggestion = (suggestion: MapSearchSuggestion) => {
    updateSelectedMapItem((item) => ({
      ...item,
      address: suggestion.label,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    }));
    setMapSuggestions([]);
    setMapSuggestionsQuery("");
  };

  const updateSelectedMapZoom = (zoom: number) => {
    updateSelectedMapItem((item) => ({
      ...item,
      zoom: Math.max(1, Math.min(20, Math.round(zoom))),
    }));
  };

  const updateSelectedMapType = (
    mapStyle: Extract<BrochureCanvasItem, { kind: "map" }>["mapStyle"],
  ) => {
    updateSelectedMapItem((item) => ({
      ...item,
      mapStyle,
    }));
  };

  const toggleSelectedMapInteractive = () => {
    updateSelectedMapItem((item) => ({
      ...item,
      isInteractive: item.isInteractive === false,
    }));
  };

  const toggleSelectedMapAddressLabel = () => {
    updateSelectedMapItem((item) => ({
      ...item,
      showAddressLabel: item.showAddressLabel === false,
    }));
  };

  const updateSelectedTextSize = (fontSize: number) => {
    updateSelectedTextItem((item) => ({
      ...item,
      fontSize: Math.max(12, Math.min(96, Math.round(fontSize))),
    }));
  };

  const toggleSelectedTextBold = () => {
    updateSelectedTextItem((item) => ({
      ...item,
      isBold: !item.isBold,
    }));
  };

  const toggleSelectedTextItalic = () => {
    updateSelectedTextItem((item) => ({
      ...item,
      isItalic: !item.isItalic,
    }));
  };

  const toggleSelectedTextBackground = () => {
    updateSelectedTextItem((item) => ({
      ...item,
      showBackground: item.showBackground === false,
    }));
  };

  const toggleSelectedTextBorder = () => {
    updateSelectedTextItem((item) => ({
      ...item,
      showBorder: item.showBorder === false,
    }));
  };

  const focusTextEditor = (selection?: { start: number; end: number }) => {
    window.requestAnimationFrame(() => {
      const editor = textEditorRef.current;
      if (!editor) return;

      editor.focus({ preventScroll: true });
      if (selection) {
        editor.setSelectionRange(selection.start, selection.end);
      }
    });
  };

  const updateTextSelection = (
    transformer: (
      value: string,
      selectionStart: number,
      selectionEnd: number,
    ) => {
      value: string;
      selectionStart: number;
      selectionEnd: number;
    },
  ) => {
    const editor = textEditorRef.current;
    if (!editor || !selectedTextItem) return;

    const nextValue = transformer(
      editor.value,
      editor.selectionStart,
      editor.selectionEnd,
    );
    updateSelectedTextContent(nextValue.value);
    focusTextEditor({
      start: nextValue.selectionStart,
      end: nextValue.selectionEnd,
    });
  };

  const toggleSelectedTextBullets = () => {
    updateTextSelection((value, selectionStart, selectionEnd) =>
      formatSelectedLines(value, selectionStart, selectionEnd, "bullets"),
    );
  };

  const toggleSelectedTextNumbers = () => {
    updateTextSelection((value, selectionStart, selectionEnd) =>
      formatSelectedLines(value, selectionStart, selectionEnd, "numbers"),
    );
  };

  const finishTextEditing = () => {
    setEditingTextItem(null);
  };

  const handleTextEditorKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    finishTextEditing();
  };

  const updateSelectedShapeStrokeWidth = (strokeWidth: number) => {
    if (!selectedShapeItem || !selectedCanvasItem || !onUpdateCanvasItem) return;

    onUpdateCanvasItem(
      selectedCanvasItem.section.id,
      selectedCanvasItem.item.id,
      (item) =>
        item.kind === "shape"
          ? {
              ...item,
              strokeWidth: Math.max(1, Math.min(16, Math.round(strokeWidth))),
            }
          : item,
    );
  };

  const handleSectionDragOver = (
    event: ReactDragEvent<HTMLElement>,
    sectionId: string,
  ) => {
    if (!draggedImage || !onAddImageToCanvas) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDropSectionId(sectionId);
    onActiveSectionChange?.(sectionId);
  };

  const handleSectionDrop = async (
    event: ReactDragEvent<HTMLElement>,
    sectionId: string,
  ) => {
    if (!draggedImage || !onAddImageToCanvas) return;
    event.preventDefault();
    setDropSectionId(null);
    const nextItemId = await onAddImageToCanvas(sectionId, draggedImage);
    if (nextItemId) {
      setSingleSelection(sectionId, nextItemId);
    }
  };

  const handleSectionDragLeave = (
    event: ReactDragEvent<HTMLElement>,
    sectionId: string,
  ) => {
    if (!draggedImage) return;
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) return;
    if (dropSectionId === sectionId) {
      setDropSectionId(null);
    }
  };

  const showSelectionPopover = editable && selectedCanvasItem;
  const selectionPopover = showSelectionPopover ? (
    <div
      className={`brochureCanvasPopover${
        selectionPanelTarget ? " brochureCanvasPopoverSidebar" : ""
      }`}
    >
      <div className="brochureCanvasPopoverHeader">
        <div className="brochureCanvasPopoverTitleWrap">
          <strong className="brochureCanvasPopoverTitle">
            {selectedCount > 1
              ? `${selectedCount} elements`
              : selectedCanvasItem.item.kind === "text"
                ? "Text"
                : selectedCanvasItem.item.kind === "shape"
                  ? selectedCanvasItem.item.shapeType
                  : selectedCanvasItem.item.kind}
          </strong>
        </div>
        <button
          className="brochureCanvasPopoverClose"
          type="button"
          onClick={() => {
            setSelectedItems([]);
            setEditingTextItem(null);
          }}
          aria-label="Close element editor"
        >
          ×
        </button>
      </div>

      <div className="brochureCanvasPopoverGrid">
        <label className="brochureCanvasPopoverField">
          <span className="brochurePreviewToolbarLabel">Color</span>
          <input
            className="brochureCanvasPopoverColor"
            type="color"
            value={selectedItemColor}
            onChange={(event) => updateSelectedItemColor(event.target.value)}
          />
        </label>

        <div className="brochureCanvasPopoverField">
          <span className="brochurePreviewToolbarLabel">Position</span>
          <div className="brochureCanvasPopoverIconRow">
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => nudgeSelected(0, -0.01)}
            >
              ↑
            </button>
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => nudgeSelected(-0.01, 0)}
            >
              ←
            </button>
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => nudgeSelected(0.01, 0)}
            >
              →
            </button>
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => nudgeSelected(0, 0.01)}
            >
              ↓
            </button>
          </div>
        </div>

        <div className="brochureCanvasPopoverField">
          <span className="brochurePreviewToolbarLabel">Layers</span>
          <div className="brochureCanvasPopoverButtonRow">
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => moveSelectedLayer("back")}
            >
              Back
            </button>
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => moveSelectedLayer("backward")}
            >
              -1
            </button>
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => moveSelectedLayer("forward")}
            >
              +1
            </button>
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => moveSelectedLayer("front")}
            >
              Front
            </button>
          </div>
        </div>

        {selectedIsText ? (
          <>
            <div className="brochureCanvasPopoverField">
              <span className="brochurePreviewToolbarLabel">Typography</span>
              <div className="brochureCanvasPopoverButtonRow">
                <button
                  className="brochurePreviewToolbarButton"
                  type="button"
                  data-active={selectedTextItem?.isBold ? "true" : "false"}
                  onClick={toggleSelectedTextBold}
                >
                  Bold
                </button>
                <button
                  className="brochurePreviewToolbarButton"
                  type="button"
                  data-active={selectedTextItem?.isItalic ? "true" : "false"}
                  onClick={toggleSelectedTextItalic}
                >
                  Italic
                </button>
                <button
                  className="brochurePreviewToolbarButton"
                  type="button"
                  onClick={toggleSelectedTextBullets}
                >
                  Bullets
                </button>
                <button
                  className="brochurePreviewToolbarButton"
                  type="button"
                  onClick={toggleSelectedTextNumbers}
                >
                  Numbers
                </button>
              </div>
            </div>

            <label className="brochureCanvasPopoverField">
              <span className="brochurePreviewToolbarLabel">Size</span>
              <input
                className="brochureCanvasPopoverNumber"
                type="number"
                min={12}
                max={96}
                value={selectedTextItem?.fontSize ?? 24}
                onChange={(event) =>
                  updateSelectedTextSize(Number(event.target.value || 24))
                }
              />
            </label>

            <div className="brochureCanvasPopoverField">
              <span className="brochurePreviewToolbarLabel">Alignment</span>
              <div className="brochureCanvasPopoverButtonRow">
                {(["left", "center", "right", "justify"] as BrochureCanvasTextAlign[]).map(
                  (alignment) => (
                    <button
                      key={alignment}
                      className="brochurePreviewToolbarButton"
                      type="button"
                      data-active={
                        selectedTextItem?.textAlign === alignment ? "true" : "false"
                      }
                      onClick={() => updateSelectedTextAlign(alignment)}
                    >
                      {alignment === "justify" ? "Justify" : alignment}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="brochureCanvasPopoverField">
              <span className="brochurePreviewToolbarLabel">Box</span>
              <div className="brochureCanvasPopoverToggleRow">
                <label className="brochureCanvasPopoverCheckbox">
                  <input
                    type="checkbox"
                    checked={selectedTextItem?.showBackground !== false}
                    onChange={toggleSelectedTextBackground}
                  />
                  <span>Background</span>
                </label>
                <label className="brochureCanvasPopoverCheckbox">
                  <input
                    type="checkbox"
                    checked={selectedTextItem?.showBorder !== false}
                    onChange={toggleSelectedTextBorder}
                  />
                  <span>Border</span>
                </label>
              </div>
            </div>

            <div className="brochureCanvasPopoverField brochureCanvasPopoverFieldHint">
              <span className="brochurePreviewToolbarLabel">Text</span>
              <span className="brochureCanvasPopoverHint">
                Double-click the text to edit it.
              </span>
            </div>
          </>
        ) : null}

        {selectedMapItem ? (
          <>
            <label className="brochureCanvasPopoverField brochureCanvasPopoverFieldWide">
              <span className="brochurePreviewToolbarLabel">Address</span>
              <div className="brochureCanvasPopoverAutosuggest">
                <input
                  className="projectFeedbackInput"
                  type="text"
                  value={selectedMapItem.address}
                  onChange={(event) => updateSelectedMapAddress(event.target.value)}
                  placeholder="1600 Amphitheatre Parkway, Mountain View, CA"
                />
                {visibleMapSuggestions.length > 0 ? (
                  <div className="brochureCanvasPopoverSuggestList">
                    {visibleMapSuggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.latitude}:${suggestion.longitude}:${suggestion.label}`}
                        className="brochureCanvasPopoverSuggestButton"
                        type="button"
                        onClick={() => applySelectedMapSuggestion(suggestion)}
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </label>

            <label className="brochureCanvasPopoverField">
              <span className="brochurePreviewToolbarLabel">Zoom</span>
              <input
                className="brochureCanvasPopoverNumber"
                type="number"
                min={1}
                max={20}
                value={selectedMapItem.zoom}
                onChange={(event) =>
                  updateSelectedMapZoom(Number(event.target.value || selectedMapItem.zoom))
                }
              />
            </label>

            <label className="brochureCanvasPopoverField">
              <span className="brochurePreviewToolbarLabel">Layer</span>
              <select
                className="projectFeedbackInput"
                value={selectedMapItem.mapStyle ?? "minimalMono"}
                onChange={(event) =>
                  updateSelectedMapType(
                    event.target.value as Extract<
                      BrochureCanvasItem,
                      { kind: "map" }
                    >["mapStyle"],
                  )
                }
              >
                <option value="minimalMono">Minimal Mono</option>
                <option value="minimalWarm">Minimal Warm</option>
                <option value="minimalBlue">Minimal Blue</option>
                <option value="color">Color</option>
                <option value="dark">Dark</option>
              </select>
            </label>

            <div className="brochureCanvasPopoverField brochureCanvasPopoverFieldWide">
              <span className="brochurePreviewToolbarLabel">Display</span>
              <div className="brochureCanvasPopoverToggleRow">
                <label className="brochureCanvasPopoverCheckbox">
                  <input
                    type="checkbox"
                    checked={selectedMapItem.isInteractive !== false}
                    onChange={toggleSelectedMapInteractive}
                  />
                  <span>Allow drag</span>
                </label>
                <label className="brochureCanvasPopoverCheckbox">
                  <input
                    type="checkbox"
                    checked={selectedMapItem.showAddressLabel !== false}
                    onChange={toggleSelectedMapAddressLabel}
                  />
                  <span>Show address</span>
                </label>
              </div>
            </div>
          </>
        ) : null}

        {selectedShapeItem ? (
          <div className="brochureCanvasPopoverField">
            <span className="brochurePreviewToolbarLabel">Stroke</span>
            <div className="brochureCanvasPopoverButtonRow">
              {[2, 4, 6, 8].map((strokeWidth) => (
                <button
                  key={strokeWidth}
                  className="brochurePreviewToolbarButton"
                  type="button"
                  data-active={
                    (selectedShapeItem.strokeWidth ?? 3) === strokeWidth ? "true" : "false"
                  }
                  onClick={() => updateSelectedShapeStrokeWidth(strokeWidth)}
                >
                  {strokeWidth}px
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="brochureCanvasPopoverFooter">
          <button
            className="brochurePreviewToolbarButton brochurePreviewToolbarButtonDanger"
            type="button"
            disabled={!selectedCanDelete}
            onClick={deleteSelectedItem}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <article
      className="brochureRenderDocument"
      data-template={template}
      data-editable={editable ? "true" : "false"}
      style={buildPageStyle(styleSettings)}
    >
      {selectionPanelTarget !== undefined
        ? selectionPopover && selectionPanelTarget
          ? createPortal(selectionPopover, selectionPanelTarget)
          : null
        : selectionPopover}

      <div className="brochureRenderPageList">
        {sections.map((section, index) => {
          const sectionIsActive = activeSectionId === section.id;
          const sortedItems = getSortedCanvasItems(section);
          const label = getBrochureSectionDefinition(section.kind)?.label ?? "Section";

          return (
            <section
              key={section.id}
              className="brochureRenderPageShell"
              data-kind={section.kind}
              data-active={sectionIsActive ? "true" : "false"}
            >
              <div className="brochureRenderPageHeader">
                <p className="brochureRenderSectionLabel">
                  {String(index + 1).padStart(2, "0")} · {label}
                </p>
              </div>

              <div
                ref={(node) => {
                  artboardRefs.current[section.id] = node;
                }}
                className="brochureRenderPage"
                data-template={template}
                data-editable={editable ? "true" : "false"}
                data-drop-target={dropSectionId === section.id ? "true" : "false"}
                onDragOver={(event) => handleSectionDragOver(event, section.id)}
                onDragLeave={(event) => handleSectionDragLeave(event, section.id)}
                onDrop={(event) => handleSectionDrop(event, section.id)}
                onPointerDown={() => {
                  if (!editable) return;
                  setSelectedItems([]);
                  setEditingTextItem(null);
                  onActiveSectionChange?.(section.id);
                }}
              >
                {sortedItems.map((item) => {
                  if (
                    !isEditableItemVisible(
                      item,
                      section,
                      styleSettings,
                      imageMap,
                      editable,
                    )
                  ) {
                    return null;
                  }

                  const isSelected =
                    resolvedSelectedItems.some(
                      (selection) =>
                        selection.sectionId === section.id && selection.itemId === item.id,
                    );
                  const isAnchorSelection =
                    resolvedSelectedItem?.sectionId === section.id &&
                    resolvedSelectedItem?.itemId === item.id;
                  const isEditingText =
                    activeEditingTextItem?.section.id === section.id &&
                    activeEditingTextItem?.item.id === item.id &&
                    item.kind === "text";
                  const resizeHandles =
                    item.kind === "media" ||
                    item.kind === "photo" ||
                    item.kind === "logo" ||
                    item.kind === "map" ||
                    (item.kind === "text" && !isEditingText)
                      ? BOX_RESIZE_HANDLES
                      : item.kind === "shape" &&
                          (item.shapeType === "line" || item.shapeType === "arrow")
                        ? LINEAR_RESIZE_HANDLES
                        : item.kind === "shape"
                          ? BOX_RESIZE_HANDLES
                          : [];

                  return (
                    <div
                      key={item.id}
                      className="brochureCanvasItem"
                      data-kind={item.kind}
                      data-selected={isSelected ? "true" : "false"}
                      data-shape={item.kind === "shape" ? item.shapeType : undefined}
                      data-text-background={
                        item.kind === "text" ? (item.showBackground === false ? "false" : "true") : undefined
                      }
                      data-text-border={
                        item.kind === "text" ? (item.showBorder === false ? "false" : "true") : undefined
                      }
                      style={getCanvasItemStyle(item)}
                      onPointerDown={(event) => {
                        if (isEditingText) return;
                        beginInteraction(event, section.id, item, "move");
                      }}
                      onClick={(event) => {
                        if (!editable) return;
                        if (isEditingText) return;
                        event.stopPropagation();
                        if (event.shiftKey || event.metaKey || event.ctrlKey) {
                          toggleSelection(section.id, item.id);
                        } else {
                          setSingleSelection(section.id, item.id);
                        }
                        setEditingTextItem(null);
                        onActiveSectionChange?.(section.id);
                      }}
                      onDoubleClick={(event) => {
                        if (!editable || item.kind !== "text") return;
                        event.stopPropagation();
                        setSingleSelection(section.id, item.id);
                        setEditingTextItem({ sectionId: section.id, itemId: item.id });
                        onActiveSectionChange?.(section.id);
                      }}
                    >
                      {isEditingText && item.kind === "text" ? (
                        <div
                          className="brochureCanvasTextBlock brochureCanvasTextBlockEditing"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <textarea
                            ref={textEditorRef}
                            className="brochureCanvasTextEditor"
                            value={item.textContent}
                            onChange={(event) => updateSelectedTextContent(event.target.value)}
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={handleTextEditorKeyDown}
                          />
                        </div>
                      ) : (
                        renderCanvasItemContent(
                          item,
                          section,
                          projectName,
                          styleSettings,
                          imageMap,
                          editable,
                          index,
                          isSelected,
                        )
                      )}

                      {editable && isAnchorSelection && resizeHandles.length > 0 ? (
                        <div className="brochureCanvasResizeHandles">
                          {resizeHandles.map((handle) => (
                            <button
                              key={handle}
                              className="brochureCanvasResizeHandle"
                              type="button"
                              data-handle={handle}
                              onPointerDown={(event) =>
                                beginInteraction(
                                  event,
                                  section.id,
                                  item,
                                  "resize",
                                  handle,
                                )
                              }
                              aria-label={`Resize ${handle}`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {editable && selectedCanvasItem ? (
        <div className="brochurePreviewSelectionBar">
          <span className="brochurePreviewToolbarLabel">
            Selected: {selectedCount > 1 ? `${selectedCount} elements` : selectedCanvasItem.item.kind}
          </span>
          <label className="brochurePreviewColorControl">
            <span className="brochurePreviewToolbarLabel">Color</span>
            <input
              type="color"
              value={selectedItemColor}
              onChange={(event) => updateSelectedItemColor(event.target.value)}
            />
          </label>
          <div className="brochurePreviewToolbarGroup">
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => moveSelectedLayer("back")}
            >
              Back
            </button>
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => moveSelectedLayer("backward")}
            >
              Down
            </button>
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => moveSelectedLayer("forward")}
            >
              Up
            </button>
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={() => moveSelectedLayer("front")}
            >
              Front
            </button>
            <button
              className="brochurePreviewToolbarButton brochurePreviewToolbarButtonDanger"
              type="button"
              disabled={!selectedCanDelete}
              onClick={deleteSelectedItem}
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
