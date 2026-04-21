"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, DragEvent, ReactNode } from "react";

import {
  createCanvasLogoItem,
  createCanvasMapItem,
  createCanvasPhotoItem,
  createCanvasTextItem,
  createDecorativeShapeItem,
  getMaxCanvasLayer,
  moveCanvasItemLayer,
  normalizeSocialLinks,
  sanitizeCanvasItems,
} from "@/lib/brochureCanvas";
import {
  BROCHURE_SECTION_DEFINITIONS,
  createBrochureSection,
  getBrochureSectionDefinition,
} from "@/lib/brochureSections";
import { BrochurePreview } from "@/components/BrochurePreview";
import type {
  BrochureCanvasItem,
  BrochureCanvasShapeType,
  BrochureFontFamily,
  BrochureOrientation,
  BrochureProject,
  BrochureSection,
  BrochureSectionKind,
  BrochureSocialLinkKey,
  BrochureTemplate,
} from "@/lib/brochureTypes";
import { getResponseErrorMessage } from "@/lib/errorMessage";

type BrochureStudioProps = {
  initialProject: BrochureProject;
};

type FeedbackTone = "neutral" | "error" | "success";
type BrochureSidebarView = "menu" | "editions";
type BrochureSidebarPanelId =
  | "design"
  | "sections"
  | "elements"
  | "edit"
  | "library";

const elementToolOptions: Array<{
  key: BrochureCanvasShapeType | "text" | "logo" | "map";
  label: string;
}> = [
  { key: "text", label: "Text" },
  { key: "map", label: "Map" },
  { key: "logo", label: "Logo" },
  { key: "rectangle", label: "Rectangle" },
  { key: "square", label: "Square" },
  { key: "circle", label: "Circle" },
  { key: "line", label: "Line" },
  { key: "arrow", label: "Arrow" },
];

const templateDescriptions: Record<BrochureTemplate, string> = {
  minimal: "Quiet editorial layout with restrained hierarchy.",
  modern: "Balanced presentation for marketing and sales.",
  luxury: "Higher contrast with a more premium brochure rhythm.",
};

const socialLinkLabels: Array<{
  key: BrochureSocialLinkKey;
  label: string;
  placeholder: string;
}> = [
  { key: "website", label: "Website", placeholder: "https://example.com" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "x", label: "X", placeholder: "https://x.com/..." },
];

function BrochureSidebarPanel({
  panelId,
  title,
  isOpen,
  onToggle,
  children,
}: {
  panelId: BrochureSidebarPanelId;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="brochureStudioSection brochureSidebarPanel" data-open={isOpen ? "true" : "false"}>
      <button
        className="brochureSidebarPanelToggle"
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="brochureStudioSectionHeader">
          <span className="brochureSidebarPanelIcon" aria-hidden="true">
            {panelId === "design" ? "◫" : null}
            {panelId === "library" ? "◩" : null}
            {panelId === "elements" ? "✦" : null}
            {panelId === "sections" ? "☰" : null}
            {panelId === "edit" ? "✎" : null}
          </span>
          <h2 className="projectFeedbackVersionTitle">{title}</h2>
        </div>
        <span className="brochureSidebarPanelSymbol">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen ? <div className="brochureSidebarPanelBody">{children}</div> : null}
    </section>
  );
}

function buildAllImages(project: BrochureProject) {
  return [...project.approvedImages, ...project.extraAssets];
}

function buildOrderedImageIds(project: BrochureProject, currentOrder: string[]) {
  const allImageIds = buildAllImages(project).map((image) => image.id);
  const nextOrder = currentOrder.filter((imageId) => allImageIds.includes(imageId));

  for (const imageId of allImageIds) {
    if (!nextOrder.includes(imageId)) {
      nextOrder.push(imageId);
    }
  }

  return nextOrder;
}

function ensureCoverFirst(sections: BrochureSection[]) {
  const cover = sections.find((section) => section.kind === "cover");
  if (!cover) return sections;

  return [cover, ...sections.filter((section) => section.id !== cover.id)];
}

function imageCountSuggestion(kind: BrochureSectionKind) {
  switch (kind) {
    case "blank":
      return 0;
    case "cover":
      return 1;
    case "location":
    case "plans":
    case "typologies":
    case "advantages":
    case "practical":
    case "cta":
    case "final":
      return 1;
    case "introduction":
    case "architecture":
    case "exteriors":
    case "interiors":
    case "amenities":
      return 2;
    default:
      return 1;
  }
}

function generateSectionContent(
  projectName: string,
  sections: BrochureSection[],
  orderedImageIds: string[],
) {
  const usedImages = new Set<string>();

  const preparedSections = ensureCoverFirst(sections).map((section) => {
    const definition = getBrochureSectionDefinition(section.kind);
    const isBlankSection = section.kind === "blank";
    const nextSection: BrochureSection = {
      ...section,
      title: isBlankSection
        ? section.title.trim()
        : section.title.trim() || definition?.defaultTitle || "Section",
      subtitle: isBlankSection
        ? section.subtitle.trim()
        : section.subtitle.trim() || definition?.defaultSubtitle || "",
      body: isBlankSection
        ? section.body.trim()
        : section.body.trim() || definition?.defaultBody || "",
      imageIds: section.imageIds.filter((imageId) => orderedImageIds.includes(imageId)),
      layoutItems: sanitizeCanvasItems(section.kind, section.layoutItems, {
        availableImageIds: orderedImageIds,
      }),
      socialLinks:
        section.kind === "final" ? normalizeSocialLinks(section.socialLinks) : undefined,
    };

    if (section.kind === "cover") {
      nextSection.title = nextSection.title || projectName;
      if (nextSection.imageIds.length === 0 && orderedImageIds[0]) {
        nextSection.imageIds = [orderedImageIds[0]];
      }
    }

    for (const imageId of nextSection.imageIds) {
      usedImages.add(imageId);
    }

    return nextSection;
  });

  const remainingImageIds = orderedImageIds.filter((imageId) => !usedImages.has(imageId));

  return preparedSections.map((section) => {
    if (section.imageIds.length > 0) return section;

    const suggestedCount = imageCountSuggestion(section.kind);
    const assignedImages = remainingImageIds.splice(0, suggestedCount);

      return {
        ...section,
        imageIds: assignedImages,
        layoutItems: sanitizeCanvasItems(section.kind, section.layoutItems, {
          availableImageIds: orderedImageIds,
        }),
        socialLinks:
          section.kind === "final" ? normalizeSocialLinks(section.socialLinks) : undefined,
      };
  });
}

function getCoverSection(project: BrochureProject, sections: BrochureSection[]) {
  const existingCover = sections.find((section) => section.kind === "cover");
  if (existingCover) return existingCover;

  const fallbackCover = createBrochureSection("cover");
  fallbackCover.title = project.title || project.name;
  fallbackCover.subtitle = project.subtitle;
  fallbackCover.body = project.body;
  fallbackCover.imageIds = project.content.imageOrder.slice(0, 1);
  return fallbackCover;
}

function buildBrochureSavePayload(
  project: BrochureProject,
  template: BrochureTemplate,
  fontFamily: BrochureFontFamily,
  orientation: BrochureOrientation,
  accentColor: string,
  backgroundColor: string,
  imageOrder: string[],
  sections: BrochureSection[],
) {
  const nextImageOrder = buildOrderedImageIds(project, imageOrder);
  const nextSections = generateSectionContent(project.name, sections, nextImageOrder);
  const coverSection = getCoverSection(project, nextSections);
  const selectedImageIds = nextImageOrder.filter((imageId) =>
    nextSections.some((section) => section.imageIds.includes(imageId)),
  );

  return {
    nextImageOrder,
    nextSections,
    coverSection,
    selectedImageIds,
    payload: {
      template,
      title: coverSection.title,
      subtitle: coverSection.subtitle,
      body: coverSection.body,
      fontFamily,
      orientation,
      accentColor,
      backgroundColor,
      imageOrder: nextImageOrder,
      selectedImageIds,
      sections: nextSections,
    },
  };
}

export function BrochureStudio({ initialProject }: BrochureStudioProps) {
  const controlsRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [project, setProject] = useState(initialProject);
  const [template, setTemplate] = useState<BrochureTemplate>(initialProject.template);
  const [fontFamily, setFontFamily] = useState<BrochureFontFamily>(
    initialProject.styleSettings.fontFamily,
  );
  const [orientation, setOrientation] = useState<BrochureOrientation>(
    initialProject.styleSettings.orientation,
  );
  const [accentColor, setAccentColor] = useState(
    initialProject.styleSettings.accentColor,
  );
  const [backgroundColor, setBackgroundColor] = useState(
    initialProject.styleSettings.backgroundColor,
  );
  const [imageOrder, setImageOrder] = useState(initialProject.content.imageOrder);
  const [sections, setSections] = useState(initialProject.content.sections);
  const [activeSectionId, setActiveSectionId] = useState(
    initialProject.content.sections[0]?.id ?? "",
  );
  const [sectionKindToAdd, setSectionKindToAdd] = useState<BrochureSectionKind | "">("");
  const [draggedImageId, setDraggedImageId] = useState("");
  const [draggedSectionId, setDraggedSectionId] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("neutral");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [hasCanvasSelection, setHasCanvasSelection] = useState(false);
  const [sidebarView, setSidebarView] = useState<BrochureSidebarView>("menu");
  const [openPanelId, setOpenPanelId] = useState<BrochureSidebarPanelId | null>("sections");
  const [elementEditorPortalTarget, setElementEditorPortalTarget] =
    useState<HTMLDivElement | null>(null);
  const [sidebarStyle, setSidebarStyle] = useState<CSSProperties | undefined>(undefined);
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveRequestIdRef = useRef(0);
  const skipNextAutosaveRef = useRef(true);

  useEffect(() => {
    setProject(initialProject);
    setTemplate(initialProject.template);
    setFontFamily(initialProject.styleSettings.fontFamily);
    setOrientation(initialProject.styleSettings.orientation);
    setAccentColor(initialProject.styleSettings.accentColor);
    setBackgroundColor(initialProject.styleSettings.backgroundColor);
    setImageOrder(initialProject.content.imageOrder);
    setSections(initialProject.content.sections);
    setActiveSectionId(initialProject.content.sections[0]?.id ?? "");
    setHasCanvasSelection(false);
    setSidebarView("menu");
    setOpenPanelId("sections");
    setAutosaveStatus("idle");
    skipNextAutosaveRef.current = true;
  }, [initialProject]);

  useEffect(() => {
    setSidebarView(hasCanvasSelection ? "editions" : "menu");
  }, [hasCanvasSelection]);

  useEffect(() => {
    if (sections.length === 0) {
      setActiveSectionId("");
      return;
    }

    if (!sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [activeSectionId, sections]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return undefined;

    let frameId = 0;

    const updateSidebarStyle = () => {
      if (typeof window === "undefined" || window.innerWidth <= 980) {
        setSidebarStyle(undefined);
        return;
      }

      const rect = controls.getBoundingClientRect();
      const viewportGap = 24;
      const nextTop = Math.max(rect.top, viewportGap);
      const nextMaxHeight = Math.max(240, window.innerHeight - nextTop - viewportGap);

      setSidebarStyle({
        position: "fixed",
        top: `${nextTop}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxHeight: `${nextMaxHeight}px`,
        zIndex: 14,
      });
    };

    const requestUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateSidebarStyle);
    };

    requestUpdate();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => requestUpdate())
        : null;
    resizeObserver?.observe(controls);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      resizeObserver?.disconnect();
    };
  }, [openPanelId, sections]);

  const allImagesById = useMemo(
    () => new Map(buildAllImages(project).map((image) => [image.id, image])),
    [project],
  );

  const orderedImageIds = useMemo(
    () => buildOrderedImageIds(project, imageOrder),
    [project, imageOrder],
  );

  const orderedImages = useMemo(
    () =>
      orderedImageIds
        .map((imageId) => allImagesById.get(imageId))
        .filter((image): image is NonNullable<typeof image> => Boolean(image)),
    [allImagesById, orderedImageIds],
  );

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/mybrochure/${project.brochureId}`;
  }, [project.brochureId]);

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? null,
    [activeSectionId, sections],
  );

  const availableSectionDefinitions = useMemo(() => {
    const usedKinds = new Set(sections.map((section) => section.kind));
    return BROCHURE_SECTION_DEFINITIONS.filter(
      (definition) => definition.kind === "blank" || !usedKinds.has(definition.kind),
    );
  }, [sections]);

  const previewSections = useMemo(
    () => generateSectionContent(project.name, sections, orderedImageIds),
    [orderedImageIds, project.name, sections],
  );

  const previewImages = useMemo(
    () => orderedImages,
    [orderedImages],
  );

  const hydrateFromProject = (nextProject: BrochureProject) => {
    skipNextAutosaveRef.current = true;
    setProject(nextProject);
    setTemplate(nextProject.template);
    setFontFamily(nextProject.styleSettings.fontFamily);
    setOrientation(nextProject.styleSettings.orientation);
    setAccentColor(nextProject.styleSettings.accentColor);
    setBackgroundColor(nextProject.styleSettings.backgroundColor);
    setImageOrder(nextProject.content.imageOrder);
    setSections(nextProject.content.sections);
    setActiveSectionId(nextProject.content.sections[0]?.id ?? "");
  };

  useEffect(() => {
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    const nextRequestId = autosaveRequestIdRef.current + 1;
    autosaveRequestIdRef.current = nextRequestId;

    autosaveTimerRef.current = window.setTimeout(() => {
      setAutosaveStatus("saving");

      const { payload: requestBody } = buildBrochureSavePayload(
        project,
        template,
        fontFamily,
        orientation,
        accentColor,
        backgroundColor,
        imageOrder,
        sections,
      );

      void fetch(`/api/brochure/projects/${project.brochureId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(
              await getResponseErrorMessage(response, "Failed to save brochure changes."),
            );
          }

          return response.json() as Promise<{ project?: BrochureProject }>;
        })
        .then(() => {
          if (autosaveRequestIdRef.current !== nextRequestId) return;
          setAutosaveStatus("saved");
        })
        .catch((error) => {
          if (autosaveRequestIdRef.current !== nextRequestId) return;
          setAutosaveStatus("error");
          setFeedbackTone("error");
          setFeedbackMessage(
            error instanceof Error
              ? error.message
              : "Failed to save brochure changes.",
          );
        });
    }, 700);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    accentColor,
    backgroundColor,
    fontFamily,
    imageOrder,
    orientation,
    project,
    sections,
    template,
  ]);

  const handleDropImage = (targetImageId: string) => {
    if (!draggedImageId || draggedImageId === targetImageId) return;

    setImageOrder((current) => {
      const next = buildOrderedImageIds(project, current).filter(
        (imageId) => imageId !== draggedImageId,
      );
      const targetIndex = next.indexOf(targetImageId);
      next.splice(targetIndex === -1 ? next.length : targetIndex, 0, draggedImageId);
      return next;
    });

    setDraggedImageId("");
  };

  const updateActiveSection = (updater: (section: BrochureSection) => BrochureSection) => {
    if (!activeSection) return;

    setSections((current) =>
      current.map((section) => (section.id === activeSection.id ? updater(section) : section)),
    );
  };

  const updateSectionById = (
    sectionId: string,
    updater: (section: BrochureSection) => BrochureSection,
  ) => {
    setSections((current) =>
      current.map((section) => (section.id === sectionId ? updater(section) : section)),
    );
  };

  const toggleSectionImage = (sectionId: string, imageId: string) => {
    updateSectionById(sectionId, (section) => {
      const hasImage = section.imageIds.includes(imageId);
      const nextImageIds = hasImage
        ? section.imageIds.filter((entry) => entry !== imageId)
        : orderedImageIds.filter((orderedId) =>
            orderedId === imageId || section.imageIds.includes(orderedId),
          );

      return {
        ...section,
        imageIds: nextImageIds,
      };
    });
  };

  const handleUpdateCanvasItem = (
    sectionId: string,
    itemId: string,
    updater: (item: BrochureCanvasItem) => BrochureCanvasItem,
  ) => {
    updateSectionById(sectionId, (section) => ({
      ...section,
      layoutItems: section.layoutItems.map((item) =>
        item.id === itemId ? updater(item) : item,
      ),
    }));
  };

  const handleUpdateCanvasItems = (
    sectionId: string,
    updater: (items: BrochureCanvasItem[]) => BrochureCanvasItem[],
  ) => {
    updateSectionById(sectionId, (section) => ({
      ...section,
      layoutItems: updater(section.layoutItems),
    }));
  };

  const handleAddDecorativeShape = (
    sectionId: string,
    shapeType: BrochureCanvasShapeType,
  ) => {
    const nextItem = createDecorativeShapeItem(
      shapeType,
      getMaxCanvasLayer(
        sections.find((section) => section.id === sectionId)?.layoutItems ?? [],
      ) + 1,
    );
    updateSectionById(sectionId, (section) => ({
      ...section,
      layoutItems: [...section.layoutItems, nextItem],
    }));
    setActiveSectionId(sectionId);
    return nextItem.id;
  };

  const handleAddCanvasText = (sectionId: string) => {
    const nextItem = createCanvasTextItem(
      getMaxCanvasLayer(
        sections.find((section) => section.id === sectionId)?.layoutItems ?? [],
      ) + 1,
    );

    updateSectionById(sectionId, (section) => ({
      ...section,
      layoutItems: [...section.layoutItems, nextItem],
    }));

    setActiveSectionId(sectionId);
    return nextItem.id;
  };

  const handleAddLogoItem = (sectionId: string) => {
    const targetSection = sections.find((section) => section.id === sectionId);
    const existingLogo = targetSection?.layoutItems.find((item) => item.kind === "logo");
    if (existingLogo) {
      setActiveSectionId(sectionId);
      return existingLogo.id;
    }

    const nextItem = createCanvasLogoItem(
      getMaxCanvasLayer(targetSection?.layoutItems ?? []) + 1,
    );

    updateSectionById(sectionId, (section) => ({
      ...section,
      layoutItems: [...section.layoutItems, nextItem],
    }));

    setActiveSectionId(sectionId);
    return nextItem.id;
  };

  const handleAddMapItem = (sectionId: string) => {
    const nextItem = createCanvasMapItem(
      getMaxCanvasLayer(
        sections.find((section) => section.id === sectionId)?.layoutItems ?? [],
      ) + 1,
    );

    updateSectionById(sectionId, (section) => ({
      ...section,
      layoutItems: [...section.layoutItems, nextItem],
    }));

    setActiveSectionId(sectionId);
    return nextItem.id;
  };

  const handleAddImageToCanvas = (sectionId: string, imageId: string) => {
    const targetSection = sections.find((section) => section.id === sectionId);
    const nextItem = createCanvasPhotoItem(
      imageId,
      getMaxCanvasLayer(targetSection?.layoutItems ?? []) + 1,
    );

    updateSectionById(sectionId, (section) => ({
      ...section,
      layoutItems: [...section.layoutItems, nextItem],
    }));

    setActiveSectionId(sectionId);
    return nextItem.id;
  };

  const handleAddElement = (
    tool: BrochureCanvasShapeType | "text" | "logo" | "map",
  ) => {
    const targetSectionId = activeSectionId ?? sections[0]?.id;
    if (!targetSectionId) return;

    if (tool === "text") {
      handleAddCanvasText(targetSectionId);
      return;
    }

    if (tool === "map") {
      handleAddMapItem(targetSectionId);
      return;
    }

    if (tool === "logo") {
      handleAddLogoItem(targetSectionId);
      return;
    }

    handleAddDecorativeShape(targetSectionId, tool);
  };

  const handleDeleteCanvasItem = (sectionId: string, itemId: string) => {
    updateSectionById(sectionId, (section) => ({
      ...section,
      layoutItems: section.layoutItems.filter((item) => item.id !== itemId),
    }));
  };

  const handleMoveCanvasItemLayer = (
    sectionId: string,
    itemId: string,
    action: "forward" | "backward" | "front" | "back",
  ) => {
    updateSectionById(sectionId, (section) => ({
      ...section,
      layoutItems: moveCanvasItemLayer(section.layoutItems, itemId, action),
    }));
  };

  const handleUpdateSocialLink = (
    sectionId: string,
    key: BrochureSocialLinkKey,
    value: string,
  ) => {
    updateSectionById(sectionId, (section) => ({
      ...section,
      socialLinks: normalizeSocialLinks({
        ...(section.socialLinks ?? {}),
        [key]: value,
      }),
    }));
  };

  const handleDeleteAsset = async (assetId: string) => {
    setDeletingAssetId(assetId);
    setFeedbackMessage("");

    try {
      const response = await fetch(`/api/brochure/projects/${project.brochureId}/assets`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assetId }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to delete image."),
        );
      }

      const payload = (await response.json()) as { project?: BrochureProject };
      if (!payload.project) {
        throw new Error("Failed to delete image.");
      }

      hydrateFromProject(payload.project);
      setFeedbackTone("success");
      setFeedbackMessage("Image deleted.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to delete image.",
      );
    } finally {
      setDeletingAssetId("");
    }
  };

  const handleDeleteLogo = async () => {
    setIsDeletingLogo(true);
    setFeedbackMessage("");

    try {
      const response = await fetch(`/api/brochure/projects/${project.brochureId}/logo`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to delete logo."),
        );
      }

      const payload = (await response.json()) as { project?: BrochureProject };
      if (!payload.project) {
        throw new Error("Failed to delete logo.");
      }

      hydrateFromProject(payload.project);
      setFeedbackTone("success");
      setFeedbackMessage("Logo deleted.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to delete logo.",
      );
    } finally {
      setIsDeletingLogo(false);
    }
  };

  const handleDropSection = (targetSectionId: string) => {
    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      setDraggedSectionId("");
      return;
    }

    setSections((current) => {
      const sourceIndex = current.findIndex(
        (section) => section.id === draggedSectionId,
      );
      const targetIndex = current.findIndex(
        (section) => section.id === targetSectionId,
      );
      if (sourceIndex === -1 || targetIndex === -1) return current;
      if (current[sourceIndex]?.kind === "cover") return current;

      const next = [...current];
      const [section] = next.splice(sourceIndex, 1);
      const resolvedTargetIndex = next.findIndex(
        (candidate) => candidate.id === targetSectionId,
      );

      if (resolvedTargetIndex === -1) {
        next.push(section);
      } else {
        next.splice(resolvedTargetIndex, 0, section);
      }

      return ensureCoverFirst(next);
    });

    setDraggedSectionId("");
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections((current) => current.filter((section) => section.id !== sectionId));
  };

  const handleAddSection = () => {
    if (!sectionKindToAdd) return;

    const nextSection = createBrochureSection(sectionKindToAdd);
    setSections((current) => [...current, nextSection]);
    setActiveSectionId(nextSection.id);
    setSectionKindToAdd("");
  };

  const togglePanel = (panelId: BrochureSidebarPanelId) => {
    setOpenPanelId((current) => (current === panelId ? null : panelId));
  };

  const saveBrochure = async (printAfterSave = false) => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveRequestIdRef.current += 1;

    setIsGenerating(true);
    setFeedbackMessage("");
    setAutosaveStatus("saving");
    const { payload: requestBody } = buildBrochureSavePayload(
      project,
      template,
      fontFamily,
      orientation,
      accentColor,
      backgroundColor,
      imageOrder,
      sections,
    );

    try {
      const response = await fetch(`/api/brochure/projects/${project.brochureId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to generate brochure."),
        );
      }

      const responsePayload = (await response.json()) as { project?: BrochureProject };
      if (!responsePayload.project) {
        throw new Error("Failed to generate brochure.");
      }

      hydrateFromProject(responsePayload.project);
      setFeedbackTone("success");
      setFeedbackMessage("Brochure generated.");
      setAutosaveStatus("saved");

      if (printAfterSave) {
        window.setTimeout(() => window.print(), 120);
      }
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to generate brochure.",
      );
      setAutosaveStatus("error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAssetsUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setIsUploadingAssets(true);
    setFeedbackMessage("");

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch(`/api/brochure/projects/${project.brochureId}/assets`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to upload brochure images."),
        );
      }

      const payload = (await response.json()) as { project?: BrochureProject };
      if (!payload.project) {
        throw new Error("Failed to upload brochure images.");
      }

      hydrateFromProject(payload.project);
      setFeedbackTone("success");
      setFeedbackMessage("Images uploaded.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to upload brochure images.",
      );
    } finally {
      setIsUploadingAssets(false);
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setIsUploadingLogo(true);
    setFeedbackMessage("");

    try {
      const formData = new FormData();
      formData.set("logo", files[0]);

      const response = await fetch(`/api/brochure/projects/${project.brochureId}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to upload logo."),
        );
      }

      const payload = (await response.json()) as { project?: BrochureProject };
      if (!payload.project) {
        throw new Error("Failed to upload logo.");
      }

      hydrateFromProject(payload.project);
      setFeedbackTone("success");
      setFeedbackMessage("Logo uploaded.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to upload logo.",
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopying(true);
      setFeedbackTone("success");
      setFeedbackMessage("Share link copied.");
      window.setTimeout(() => setIsCopying(false), 1400);
    } catch {
      setFeedbackTone("error");
      setFeedbackMessage("Failed to copy share link.");
    }
  };

  const brochureFontOptions: Array<{
    key: BrochureFontFamily;
    title: string;
  }> = [
    { key: "helvetica", title: "Helvetica" },
    { key: "garamond", title: "Garamond" },
    { key: "georgia", title: "Georgia" },
    { key: "times", title: "Times" },
  ];

  return (
    <section className="brochureStudioShell">
      <header className="brochureStudioHeader">
        <div className="projectFeedbackIntro">
          <p className="projectFeedbackEyebrow">myBrochure</p>
          <h1 className="projectFeedbackTitle">{project.name}</h1>
          <p className="projectFeedbackVersionMeta">
            Add structured sections, assign the right visuals, then generate a
            polished brochure instantly.
          </p>
        </div>

        <div className="brochureStudioToolbar">
          <span className="brochureStudioAutosave" data-status={autosaveStatus}>
            {autosaveStatus === "saving"
              ? "Saving changes..."
              : autosaveStatus === "saved"
                ? "Changes saved"
                : autosaveStatus === "error"
                  ? "Save error"
                  : "Autosave on"}
          </span>
          <button
            className="projectFeedbackAction projectFeedbackActionDark"
            type="button"
            onClick={() => void saveBrochure(false)}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate brochure"}
          </button>
          <button
            className={`projectFeedbackAction${isCopying ? " projectFeedbackActionSuccess" : ""}`}
            type="button"
            onClick={() => void handleCopyLink()}
          >
            {isCopying ? "Copied" : "Copy link"}
          </button>
          <button
            className="projectFeedbackAction"
            type="button"
            onClick={() => void saveBrochure(true)}
            disabled={isGenerating}
          >
            Save PDF
          </button>
        </div>
      </header>

      {feedbackMessage ? (
        <p
          className={`projectFeedbackMessage${
            feedbackTone === "error" ? " projectFeedbackMessageError" : ""
          }`}
        >
          {feedbackMessage}
        </p>
      ) : null}

      <div className="brochureStudioLayout">
        <aside ref={controlsRef} className="brochureStudioControls">
          <div ref={panelRef} className="brochureBuilderPanel" style={sidebarStyle}>
            <div className="brochureSidebarTabs" role="tablist" aria-label="Sidebar view">
              <button
                className="brochureSidebarTabButton"
                type="button"
                role="tab"
                aria-selected={sidebarView === "menu"}
                data-active={sidebarView === "menu" ? "true" : "false"}
                onClick={() => setSidebarView("menu")}
              >
                Menu
              </button>
              <button
                className="brochureSidebarTabButton"
                type="button"
                role="tab"
                aria-selected={sidebarView === "editions"}
                data-active={sidebarView === "editions" ? "true" : "false"}
                onClick={() => setSidebarView("editions")}
              >
                Editions
              </button>
            </div>

            {sidebarView === "menu" ? (
              <>
                <BrochureSidebarPanel
                  panelId="design"
                  title="Design"
                  isOpen={openPanelId === "design"}
                  onToggle={() => togglePanel("design")}
                >
                  <div className="brochureTemplateGrid brochureTemplateGridCompact">
                    {(Object.keys(templateDescriptions) as BrochureTemplate[]).map((key) => (
                      <button
                        key={key}
                        className="brochureTemplateCard"
                        type="button"
                        data-active={template === key ? "true" : "false"}
                        onClick={() => setTemplate(key)}
                      >
                        <strong>{key.charAt(0).toUpperCase() + key.slice(1)}</strong>
                        <span>{templateDescriptions[key]}</span>
                      </button>
                    ))}
                  </div>

                  <label className="projectFeedbackField">
                    <span>Font family</span>
                    <select
                      className="projectFeedbackInput"
                      value={fontFamily}
                      onChange={(event) =>
                        setFontFamily(event.target.value as BrochureFontFamily)
                      }
                    >
                      {brochureFontOptions.map((font) => (
                        <option key={font.key} value={font.key}>
                          {font.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="projectFeedbackField">
                    <span>Accent color</span>
                    <input
                      className="brochureColorInput"
                      type="color"
                      value={accentColor}
                      onChange={(event) => setAccentColor(event.target.value)}
                    />
                  </label>

                  <label className="projectFeedbackField">
                    <span>Background color</span>
                    <input
                      className="brochureColorInput"
                      type="color"
                      value={backgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                    />
                  </label>

                  <label className="projectFeedbackField">
                    <span>Format</span>
                    <select
                      className="projectFeedbackInput"
                      value={orientation}
                      onChange={(event) =>
                        setOrientation(event.target.value as BrochureOrientation)
                      }
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Paysage</option>
                    </select>
                  </label>
                </BrochureSidebarPanel>

                <BrochureSidebarPanel
                  panelId="library"
                  title="Library"
                  isOpen={openPanelId === "library"}
                  onToggle={() => togglePanel("library")}
                >
                  <div className="brochureStudioToolbar">
                    <label className="projectFeedbackUpload brochureStudioUpload">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => void handleAssetsUpload(event)}
                        disabled={isUploadingAssets}
                      />
                      {isUploadingAssets ? "Uploading..." : "Upload images"}
                    </label>
                  </div>

                  <div className="brochureImageList">
                    {orderedImages.map((image, index) => (
                      <article
                        key={image.id}
                        className="brochureImageRow"
                        draggable
                        onDragStart={() => setDraggedImageId(image.id)}
                        onDragOver={(event: DragEvent<HTMLElement>) => event.preventDefault()}
                        onDrop={() => handleDropImage(image.id)}
                        onDragEnd={() => setDraggedImageId("")}
                      >
                        <div className="brochureImageRowMedia">
                          <img src={image.url} alt={image.label} loading="lazy" decoding="async" />
                        </div>

                        <div className="brochureImageRowBody">
                          <div className="brochureImageRowCopy">
                            <strong>{image.label}</strong>
                            <span>{image.meta}</span>
                          </div>

                          <div className="brochureImageRowActions">
                            <div className="brochureImageActionGroup">
                              <span className="brochureImageOrderBadge">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              {image.source === "extra" ? (
                                <button
                                  className="brochureImageDeleteButton"
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void handleDeleteAsset(image.id);
                                  }}
                                  disabled={deletingAssetId === image.id}
                                  aria-label={`Delete ${image.label}`}
                                  title="Delete image"
                                >
                                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                    <path
                                      d="M3.5 4.5H12.5M6.25 2.5H9.75M5.25 6.25V11.25M8 6.25V11.25M10.75 6.25V11.25M4.5 4.5L5 13H11L11.5 4.5"
                                      stroke="currentColor"
                                      strokeWidth="1.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </BrochureSidebarPanel>

                <div className="brochureSidebarDivider" aria-hidden="true" />

                <BrochureSidebarPanel
                  panelId="elements"
                  title="Elements"
                  isOpen={openPanelId === "elements"}
                  onToggle={() => togglePanel("elements")}
                >
                  <div className="brochureElementMeta">
                    <span className="projectFeedbackVersionMeta">Active page</span>
                    <strong>
                      {activeSection
                        ? getBrochureSectionDefinition(activeSection.kind)?.label ?? "Section"
                        : "Select a section"}
                    </strong>
                  </div>

                  <div className="brochureElementGrid">
                    {elementToolOptions.map((tool) => (
                      <button
                        key={tool.key}
                        className="brochureElementButton"
                        type="button"
                        onClick={() => handleAddElement(tool.key)}
                        disabled={!activeSection}
                      >
                        {tool.label}
                      </button>
                    ))}
                  </div>

                  <div className="brochureElementAssetTools">
                    <label className="projectFeedbackUpload brochureStudioUpload brochureElementAssetButton">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => void handleLogoUpload(event)}
                        disabled={isUploadingLogo}
                      />
                      {isUploadingLogo ? "Uploading..." : "Add logo"}
                    </label>

                    <button
                      className="projectFeedbackAction"
                      type="button"
                      onClick={() => void handleDeleteLogo()}
                      disabled={isDeletingLogo || !project.styleSettings.logoUrl}
                    >
                      {isDeletingLogo ? "Deleting..." : "Delete logo"}
                    </button>
                  </div>
                </BrochureSidebarPanel>

                <BrochureSidebarPanel
                  panelId="sections"
                  title="Sections"
                  isOpen={openPanelId === "sections"}
                  onToggle={() => togglePanel("sections")}
                >
                  <div className="brochureSectionAddRow">
                    <select
                      className="projectFeedbackInput"
                      value={sectionKindToAdd}
                      onChange={(event) =>
                        setSectionKindToAdd(event.target.value as BrochureSectionKind | "")
                      }
                    >
                      <option value="">Add a section</option>
                      {availableSectionDefinitions.map((definition) => (
                        <option key={definition.kind} value={definition.kind}>
                          {definition.label}
                        </option>
                      ))}
                    </select>

                    <button
                      className="projectFeedbackAction"
                      type="button"
                      onClick={handleAddSection}
                      disabled={!sectionKindToAdd}
                    >
                      Add
                    </button>
                  </div>

                  <div className="brochureSectionList">
                    {sections.map((section) => {
                      const definition = getBrochureSectionDefinition(section.kind);
                      const canDeleteSection = section.kind !== "cover";
                      const canReorderSection = section.kind !== "cover";

                      return (
                        <article
                          key={section.id}
                          className="brochureSectionTab"
                          data-active={activeSectionId === section.id ? "true" : "false"}
                          data-dragging={draggedSectionId === section.id ? "true" : "false"}
                          onDragOver={(event: DragEvent<HTMLElement>) => {
                            if (!draggedSectionId || draggedSectionId === section.id) return;
                            event.preventDefault();
                          }}
                          onDrop={() => handleDropSection(section.id)}
                        >
                          {canReorderSection ? (
                            <span
                              className="brochureSectionTabDragHandle"
                              draggable
                              onDragStart={(event: DragEvent<HTMLSpanElement>) => {
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData("text/plain", section.id);
                                setDraggedSectionId(section.id);
                              }}
                              onDragEnd={() => setDraggedSectionId("")}
                              aria-label={`Reorder ${definition?.label ?? "section"}`}
                              title="Drag to reorder"
                            >
                              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <circle cx="5" cy="4" r="1.1" fill="currentColor" />
                                <circle cx="11" cy="4" r="1.1" fill="currentColor" />
                                <circle cx="5" cy="8" r="1.1" fill="currentColor" />
                                <circle cx="11" cy="8" r="1.1" fill="currentColor" />
                                <circle cx="5" cy="12" r="1.1" fill="currentColor" />
                                <circle cx="11" cy="12" r="1.1" fill="currentColor" />
                              </svg>
                            </span>
                          ) : (
                            <span className="brochureSectionTabDragSpacer" aria-hidden="true" />
                          )}

                          <button
                            className="brochureSectionTabMain"
                            type="button"
                            onClick={() => {
                              setActiveSectionId(section.id);
                              setOpenPanelId("edit");
                            }}
                          >
                            <strong>{definition?.label ?? "Section"}</strong>
                            <span>{section.imageIds.length} image(s)</span>
                          </button>

                          {canDeleteSection ? (
                            <button
                              className="brochureSectionTabDelete"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveSection(section.id);
                              }}
                              aria-label={`Delete ${definition?.label ?? "section"}`}
                              title="Delete section"
                            >
                              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path
                                  d="M3.5 4.5H12.5M6.25 2.5H9.75M5.25 6.25V11.25M8 6.25V11.25M10.75 6.25V11.25M4.5 4.5L5 13H11L11.5 4.5"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          ) : (
                            <span className="brochureSectionTabDeleteSpacer" aria-hidden="true" />
                          )}
                        </article>
                      );
                    })}
                  </div>
                </BrochureSidebarPanel>

                {activeSection ? (
                  <BrochureSidebarPanel
                    panelId="edit"
                    title="Edition"
                    isOpen={openPanelId === "edit"}
                    onToggle={() => togglePanel("edit")}
                  >
                    <label className="projectFeedbackField">
                      <span>Title</span>
                      <input
                        className="projectFeedbackInput"
                        type="text"
                        value={activeSection.title}
                        onChange={(event) =>
                          updateActiveSection((section) => ({
                            ...section,
                            title: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="projectFeedbackField">
                      <span>Subtitle</span>
                      <input
                        className="projectFeedbackInput"
                        type="text"
                        value={activeSection.subtitle}
                        onChange={(event) =>
                          updateActiveSection((section) => ({
                            ...section,
                            subtitle: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="projectFeedbackField">
                      <span>Body text</span>
                      <textarea
                        className="projectFeedbackTextarea brochureStudioTextarea"
                        value={activeSection.body}
                        onChange={(event) =>
                          updateActiveSection((section) => ({
                            ...section,
                            body: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <div className="brochureSectionPicker">
                      <p className="projectFeedbackVersionMeta">Images for this section</p>
                      <div className="brochureSectionImageGrid">
                        {orderedImages.map((image) => {
                          const isActive = activeSection.imageIds.includes(image.id);

                          return (
                            <button
                              key={image.id}
                              className="brochureSectionImageCard"
                              type="button"
                              data-active={isActive ? "true" : "false"}
                              onClick={() => toggleSectionImage(activeSection.id, image.id)}
                            >
                              <img
                                src={image.url}
                                alt={image.label}
                                loading="lazy"
                                decoding="async"
                              />
                              <span>{image.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {activeSection.kind === "final" ? (
                      <div className="brochureSectionSocialGrid">
                        <p className="projectFeedbackVersionMeta">Social links</p>
                        <div className="brochureSectionSocialFields">
                          {socialLinkLabels.map((socialLink) => (
                            <label key={socialLink.key} className="projectFeedbackField">
                              <span>{socialLink.label}</span>
                              <input
                                className="projectFeedbackInput"
                                type="url"
                                value={activeSection.socialLinks?.[socialLink.key] ?? ""}
                                placeholder={socialLink.placeholder}
                                onChange={(event) =>
                                  handleUpdateSocialLink(
                                    activeSection.id,
                                    socialLink.key,
                                    event.target.value,
                                  )
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </BrochureSidebarPanel>
                ) : null}
              </>
            ) : (
              <section className="brochureStudioSection brochureSidebarPanel">
                <div className="brochureSidebarPanelBody">
                  {hasCanvasSelection ? (
                    <div
                      ref={setElementEditorPortalTarget}
                      className="brochureElementEditorMount"
                    />
                  ) : (
                    <p className="projectFeedbackVersionMeta brochureSidebarEmptyState">
                      Select an element on the page to open its editing controls here.
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        </aside>

        <section className="brochurePreviewShell brochureBuilderPreview">
          <div className="brochurePreviewSurface">
            <BrochurePreview
              projectName={project.name}
              template={template}
              styleSettings={{
                ...project.styleSettings,
                fontFamily,
                orientation,
                accentColor,
                backgroundColor,
              }}
              sections={previewSections}
              images={previewImages}
              editable
              activeSectionId={activeSectionId}
              draggedImageId={draggedImageId}
              selectionPanelTarget={elementEditorPortalTarget}
              onSelectionStateChange={setHasCanvasSelection}
              onActiveSectionChange={setActiveSectionId}
              onAddImageToCanvas={handleAddImageToCanvas}
              onUpdateCanvasItem={handleUpdateCanvasItem}
              onUpdateCanvasItems={handleUpdateCanvasItems}
              onDeleteCanvasItem={handleDeleteCanvasItem}
              onMoveCanvasItemLayer={handleMoveCanvasItemLayer}
            />
          </div>
        </section>
      </div>
    </section>
  );
}
