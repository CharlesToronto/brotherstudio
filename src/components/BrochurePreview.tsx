"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

import { getBrochureSectionDefinition } from "@/lib/brochureSections";
import type {
  BrochureCanvasItem,
  BrochureCanvasShapeType,
  BrochureFontFamily,
  BrochureImageItem,
  BrochureSection,
  BrochureStyleSettings,
  BrochureTemplate,
  BrochureCanvasTextAlign,
} from "@/lib/brochureTypes";

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
  onAddDecorativeShape?: (
    sectionId: string,
    shapeType: BrochureCanvasShapeType,
  ) => string;
  onAddTextItem?: (sectionId: string) => string;
  draggedImageId?: string;
  onAssignImageToSection?: (sectionId: string, imageId: string) => void;
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

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "start" | "end";

type InteractionState = {
  sectionId: string;
  itemId: string;
  mode: "move" | "resize";
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  startItem: BrochureCanvasItem;
  artboardWidth: number;
  artboardHeight: number;
};

const fontFamilyMap: Record<BrochureFontFamily, string> = {
  helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  garamond: 'Garamond, "Times New Roman", serif',
  georgia: 'Georgia, "Times New Roman", serif',
  times: '"Times New Roman", Times, serif',
};

const SHAPE_TOOL_OPTIONS: Array<{
  key: BrochureCanvasShapeType;
  label: string;
}> = [
  { key: "rectangle", label: "Rectangle" },
  { key: "square", label: "Square" },
  { key: "circle", label: "Circle" },
  { key: "line", label: "Line" },
  { key: "arrow", label: "Arrow" },
];

const BOX_RESIZE_HANDLES: ResizeHandle[] = ["nw", "ne", "sw", "se"];
const LINEAR_RESIZE_HANDLES: ResizeHandle[] = ["start", "end"];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function buildPageStyle(styleSettings: BrochureStyleSettings) {
  return {
    "--brochure-font-family": fontFamilyMap[styleSettings.fontFamily],
    "--brochure-accent-color": styleSettings.accentColor,
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

function getCanvasItemRefKey(sectionId: string, itemId: string) {
  return `${sectionId}:${itemId}`;
}

function canDeleteCanvasItem(item: BrochureCanvasItem) {
  return item.kind === "shape" || item.kind === "text";
}

function nudgeCanvasItem(item: BrochureCanvasItem, deltaX: number, deltaY: number) {
  return {
    ...item,
    x: clamp(item.x + deltaX, 0, 1 - item.width),
    y: clamp(item.y + deltaY, 0, 1 - item.height),
  };
}

function getDefaultSelectedItem(
  sections: BrochureSection[],
  selectedItem: SelectedCanvasItem | null,
) {
  if (!selectedItem) return null;

  const section = sections.find((entry) => entry.id === selectedItem.sectionId);
  if (!section) return null;
  if (!section.layoutItems.some((item) => item.id === selectedItem.itemId)) return null;
  return selectedItem;
}

function getSelectedCanvasItem(
  sections: BrochureSection[],
  selectedItem: SelectedCanvasItem | null,
) {
  const nextSelection = getDefaultSelectedItem(sections, selectedItem);
  if (!nextSelection) return null;

  const section = sections.find((entry) => entry.id === nextSelection.sectionId);
  const item = section?.layoutItems.find((entry) => entry.id === nextSelection.itemId);
  if (!section || !item) return null;

  return {
    section,
    item,
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
  onAddDecorativeShape,
  onAddTextItem,
  draggedImageId,
  onAssignImageToSection,
  onDeleteCanvasItem,
  onMoveCanvasItemLayer,
}: BrochurePreviewProps) {
  const imageMap = useMemo(() => buildImageMap(images), [images]);
  const artboardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const interactionRef = useRef<InteractionState | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedCanvasItem | null>(null);
  const [selectedPopoverStyle, setSelectedPopoverStyle] = useState<CSSProperties | null>(
    null,
  );
  const [dropSectionId, setDropSectionId] = useState<string | null>(null);
  const resolvedSelectedItem = editable
    ? getDefaultSelectedItem(sections, selectedItem)
    : null;

  const selectedCanvasItem = useMemo(
    () => (editable ? getSelectedCanvasItem(sections, resolvedSelectedItem) : null),
    [editable, resolvedSelectedItem, sections],
  );

  useEffect(() => {
    if (!editable || !onUpdateCanvasItem) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) return;

      const deltaX = event.clientX - interaction.startX;
      const deltaY = event.clientY - interaction.startY;

      if (interaction.mode === "move") {
        onUpdateCanvasItem(interaction.sectionId, interaction.itemId, (item) =>
          clampCanvasItem(
            {
              ...item,
              x: interaction.startItem.x + deltaX / interaction.artboardWidth,
              y: interaction.startItem.y + deltaY / interaction.artboardHeight,
            },
            interaction.artboardWidth,
            interaction.artboardHeight,
          ),
        );
        return;
      }

      onUpdateCanvasItem(interaction.sectionId, interaction.itemId, (item) => {
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
  }, [editable, onUpdateCanvasItem]);

  useEffect(() => {
    if (!editable || !selectedCanvasItem) {
      const clearFrame = window.requestAnimationFrame(() => {
        setSelectedPopoverStyle(null);
      });

      return () => {
        window.cancelAnimationFrame(clearFrame);
      };
    }

    const updatePopoverPosition = () => {
      const anchor =
        itemRefs.current[
          getCanvasItemRefKey(
            selectedCanvasItem.section.id,
            selectedCanvasItem.item.id,
          )
        ];

      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const popoverWidth = Math.min(window.innerWidth - 24, 360);
      const placeBelow = rect.top < 220;
      const centerX = rect.left + rect.width / 2;
      const safeLeft = clamp(
        centerX,
        popoverWidth / 2 + 16,
        window.innerWidth - popoverWidth / 2 - 16,
      );

      setSelectedPopoverStyle({
        top: `${placeBelow ? rect.bottom + 14 : rect.top - 14}px`,
        left: `${safeLeft}px`,
        width: `${popoverWidth}px`,
        "--brochure-popover-shift": placeBelow ? "0%" : "-100%",
      } as CSSProperties);
    };

    const initialFrame = window.requestAnimationFrame(updatePopoverPosition);
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [editable, selectedCanvasItem, sections]);

  const beginInteraction = (
    event: ReactPointerEvent<HTMLElement>,
    sectionId: string,
    item: BrochureCanvasItem,
    mode: "move" | "resize",
    handle?: ResizeHandle,
  ) => {
    if (!editable) return;

    const artboard = artboardRefs.current[sectionId];
    if (!artboard) return;

    const artboardRect = artboard.getBoundingClientRect();
    if (artboardRect.width <= 0 || artboardRect.height <= 0) return;

    event.preventDefault();
    event.stopPropagation();
    setSelectedItem({ sectionId, itemId: item.id });
    onActiveSectionChange?.(sectionId);
    interactionRef.current = {
      sectionId,
      itemId: item.id,
      mode,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startItem: item,
      artboardWidth: artboardRect.width,
      artboardHeight: artboardRect.height,
    };
    document.body.style.setProperty("user-select", "none");
  };

  const handleAddShape = (shapeType: BrochureCanvasShapeType) => {
    if (!editable || !onAddDecorativeShape) return;

    const targetSectionId = activeSectionId ?? sections[0]?.id;
    if (!targetSectionId) return;

    const nextItemId = onAddDecorativeShape(targetSectionId, shapeType);
    setSelectedItem({ sectionId: targetSectionId, itemId: nextItemId });
    onActiveSectionChange?.(targetSectionId);
  };

  const handleAddText = () => {
    if (!editable || !onAddTextItem) return;

    const targetSectionId = activeSectionId ?? sections[0]?.id;
    if (!targetSectionId) return;

    const nextItemId = onAddTextItem(targetSectionId);
    setSelectedItem({ sectionId: targetSectionId, itemId: nextItemId });
    onActiveSectionChange?.(targetSectionId);
  };

  const selectedIsShape = selectedCanvasItem?.item.kind === "shape";
  const selectedIsText = selectedCanvasItem?.item.kind === "text";
  const selectedShapeItem =
    selectedCanvasItem?.item.kind === "shape" ? selectedCanvasItem.item : null;
  const selectedTextItem =
    selectedCanvasItem?.item.kind === "text" ? selectedCanvasItem.item : null;
  const selectedCanDelete = selectedCanvasItem
    ? canDeleteCanvasItem(selectedCanvasItem.item)
    : false;
  const selectedItemColor =
    selectedCanvasItem?.item.color ?? styleSettings.accentColor;

  const updateSelectedItemColor = (nextColor: string) => {
    if (!selectedCanvasItem || !onUpdateCanvasItem) return;

    onUpdateCanvasItem(
      selectedCanvasItem.section.id,
      selectedCanvasItem.item.id,
      (item) => ({
        ...item,
        color: nextColor,
      }),
    );
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
    if (!selectedCanvasItem || !onUpdateCanvasItem) return;

    onUpdateCanvasItem(
      selectedCanvasItem.section.id,
      selectedCanvasItem.item.id,
      (item) => nudgeCanvasItem(item, deltaX, deltaY),
    );
  };

  const deleteSelectedItem = () => {
    if (!selectedCanvasItem || !selectedCanDelete) return;

    onDeleteCanvasItem?.(
      selectedCanvasItem.section.id,
      selectedCanvasItem.item.id,
    );
    setSelectedItem(null);
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
    if (!draggedImageId || !onAssignImageToSection) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDropSectionId(sectionId);
    onActiveSectionChange?.(sectionId);
  };

  const handleSectionDrop = (
    event: ReactDragEvent<HTMLElement>,
    sectionId: string,
  ) => {
    if (!draggedImageId || !onAssignImageToSection) return;
    event.preventDefault();
    setDropSectionId(null);
    onAssignImageToSection(sectionId, draggedImageId);
  };

  const handleSectionDragLeave = (
    event: ReactDragEvent<HTMLElement>,
    sectionId: string,
  ) => {
    if (!draggedImageId) return;
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) return;
    if (dropSectionId === sectionId) {
      setDropSectionId(null);
    }
  };

  return (
    <article
      className="brochureRenderDocument"
      data-template={template}
      data-editable={editable ? "true" : "false"}
      style={buildPageStyle(styleSettings)}
    >
      {editable ? (
        <div className="brochurePreviewToolbar">
          <div className="brochurePreviewToolbarGroup brochurePreviewToolbarGroupShapes">
            <span className="brochurePreviewToolbarLabel">
              {activeSectionId
                ? getBrochureSectionDefinition(
                    sections.find((section) => section.id === activeSectionId)?.kind ??
                      sections[0]?.kind ??
                      "cover",
                  )?.label ?? "Canvas"
                : "Canvas"}
            </span>
            <button
              className="brochurePreviewToolbarButton"
              type="button"
              onClick={handleAddText}
            >
              Text
            </button>
            {SHAPE_TOOL_OPTIONS.map((option) => (
              <button
                key={option.key}
                className="brochurePreviewToolbarButton"
                type="button"
                onClick={() => handleAddShape(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {editable && selectedCanvasItem && selectedPopoverStyle ? (
        <div className="brochureCanvasPopover" style={selectedPopoverStyle}>
          <div className="brochureCanvasPopoverHeader">
            <div className="brochureCanvasPopoverTitleWrap">
              <span className="brochurePreviewToolbarLabel">Selected element</span>
              <strong className="brochureCanvasPopoverTitle">
                {selectedCanvasItem.item.kind === "text"
                  ? "Text block"
                  : selectedCanvasItem.item.kind === "shape"
                    ? selectedCanvasItem.item.shapeType
                    : selectedCanvasItem.item.kind}
              </strong>
            </div>
            <button
              className="brochureCanvasPopoverClose"
              type="button"
              onClick={() => setSelectedItem(null)}
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
                <label className="brochureCanvasPopoverField brochureCanvasPopoverFieldWide">
                  <span className="brochurePreviewToolbarLabel">Text</span>
                  <textarea
                    className="brochureCanvasPopoverTextarea"
                    value={selectedTextItem?.textContent ?? ""}
                    onChange={(event) => updateSelectedTextContent(event.target.value)}
                  />
                </label>

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
                  </div>
                </div>

                <div className="brochureCanvasPopoverField">
                  <span className="brochurePreviewToolbarLabel">Alignment</span>
                  <div className="brochureCanvasPopoverButtonRow">
                    {(["left", "center", "right"] as BrochureCanvasTextAlign[]).map(
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
                          {alignment}
                        </button>
                      ),
                    )}
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
                disabled={!selectedCanDelete || (!selectedIsShape && !selectedIsText)}
                onClick={deleteSelectedItem}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
                  setSelectedItem(null);
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
                    resolvedSelectedItem?.sectionId === section.id &&
                    resolvedSelectedItem?.itemId === item.id;
                  const resizeHandles =
                    item.kind === "media" || item.kind === "text"
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
                      ref={(node) => {
                        itemRefs.current[getCanvasItemRefKey(section.id, item.id)] = node;
                      }}
                      className="brochureCanvasItem"
                      data-kind={item.kind}
                      data-selected={isSelected ? "true" : "false"}
                      data-shape={item.kind === "shape" ? item.shapeType : undefined}
                      style={getCanvasItemStyle(item)}
                      onPointerDown={(event) =>
                        beginInteraction(event, section.id, item, "move")
                      }
                      onClick={(event) => {
                        if (!editable) return;
                        event.stopPropagation();
                        setSelectedItem({ sectionId: section.id, itemId: item.id });
                        onActiveSectionChange?.(section.id);
                      }}
                    >
                      {renderCanvasItemContent(
                        item,
                        section,
                        projectName,
                        styleSettings,
                        imageMap,
                        editable,
                        index,
                      )}

                      {editable && isSelected && resizeHandles.length > 0 ? (
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
            Selected: {selectedCanvasItem.item.kind}
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
