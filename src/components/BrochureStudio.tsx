"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, DragEvent, ReactNode } from "react";
import { useDeferredValue } from "react";

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
import { BrochureImmersive } from "@/components/BrochureImmersive";
import { BrochureMapCanvas } from "@/components/BrochureMapCanvas";
import { BrochurePreview } from "@/components/BrochurePreview";
import {
  createDefaultBrochureImmersiveBuilder,
  generateBrochureImmersiveSections,
  parseLines,
  serializeLines,
} from "@/lib/brochureImmersiveBuilder";
import type {
  BrochureCanvasItem,
  BrochureCanvasShapeType,
  BrochureExperienceMode,
  BrochureFontFamily,
  BrochureImmersiveBuilder,
  BrochureImmersiveMotionPreset,
  BrochureImmersiveSectionKey,
  BrochureImmersiveTheme,
  BrochureImmersiveVideoMode,
  BrochureOrientation,
  BrochureProject,
  BrochureSection,
  BrochureSectionKind,
  BrochureSocialLinkKey,
  BrochureTemplate,
} from "@/lib/brochureTypes";
import { getResponseErrorMessage } from "@/lib/errorMessage";
import type { BrochureDraggedImage, UnsplashSearchPhoto } from "@/lib/unsplash";

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
  | "library"
  | "unsplash"
  | "cinematic";

type BrochureHistorySnapshot = {
  template: BrochureTemplate;
  experienceMode: BrochureExperienceMode;
  immersiveTheme: BrochureImmersiveTheme;
  immersiveMotionPreset: BrochureImmersiveMotionPreset;
  showImmersiveProgressNav: boolean;
  fontFamily: BrochureFontFamily;
  orientation: BrochureOrientation;
  accentColor: string;
  backgroundColor: string;
  imageOrder: string[];
  sections: BrochureSection[];
  immersiveBuilder: BrochureImmersiveBuilder;
};

type MapSearchSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
};

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

const immersiveSectionOptions: Array<{
  key: BrochureImmersiveSectionKey;
  label: string;
}> = [
  { key: "hero", label: "Hero" },
  { key: "gallery", label: "Galerie d'images" },
  { key: "video", label: "Video immersive" },
  { key: "key-points", label: "Points cles" },
  { key: "description", label: "Description du projet" },
  { key: "location", label: "Localisation" },
  { key: "lifestyle", label: "Lifestyle / ambiance" },
  { key: "cta", label: "Call-to-action" },
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
            {panelId === "cinematic" ? "◇" : null}
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
    const isBlankSection = section.kind === "blank";
    const nextSection: BrochureSection = {
      ...section,
      title: isBlankSection ? section.title.trim() : section.title.trim(),
      subtitle: isBlankSection ? section.subtitle.trim() : section.subtitle.trim(),
      body: isBlankSection ? section.body.trim() : section.body.trim(),
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
  experienceMode: BrochureExperienceMode,
  immersiveTheme: BrochureImmersiveTheme,
  immersiveMotionPreset: BrochureImmersiveMotionPreset,
  showImmersiveProgressNav: boolean,
  fontFamily: BrochureFontFamily,
  orientation: BrochureOrientation,
  accentColor: string,
  backgroundColor: string,
  imageOrder: string[],
  sections: BrochureSection[],
  immersiveBuilder: BrochureImmersiveBuilder,
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
      experienceMode,
      immersiveSettings: {
        theme: immersiveTheme,
        motionPreset: immersiveMotionPreset,
        showProgressNav: showImmersiveProgressNav,
      },
      immersiveBuilder,
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

function createHistorySnapshot(
  template: BrochureTemplate,
  experienceMode: BrochureExperienceMode,
  immersiveTheme: BrochureImmersiveTheme,
  immersiveMotionPreset: BrochureImmersiveMotionPreset,
  showImmersiveProgressNav: boolean,
  fontFamily: BrochureFontFamily,
  orientation: BrochureOrientation,
  accentColor: string,
  backgroundColor: string,
  imageOrder: string[],
  sections: BrochureSection[],
  immersiveBuilder: BrochureImmersiveBuilder,
): BrochureHistorySnapshot {
  return {
    template,
    experienceMode,
    immersiveTheme,
    immersiveMotionPreset,
    showImmersiveProgressNav,
    fontFamily,
    orientation,
    accentColor,
    backgroundColor,
    imageOrder,
    sections,
    immersiveBuilder,
  };
}

export function BrochureStudio({ initialProject }: BrochureStudioProps) {
  const controlsRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [project, setProject] = useState(initialProject);
  const [template, setTemplate] = useState<BrochureTemplate>(initialProject.template);
  const [experienceMode, setExperienceMode] = useState<BrochureExperienceMode>(
    initialProject.experienceMode,
  );
  const [immersiveTheme, setImmersiveTheme] = useState<BrochureImmersiveTheme>(
    initialProject.immersiveSettings.theme,
  );
  const [immersiveMotionPreset, setImmersiveMotionPreset] =
    useState<BrochureImmersiveMotionPreset>(
      initialProject.immersiveSettings.motionPreset,
    );
  const [showImmersiveProgressNav, setShowImmersiveProgressNav] = useState(
    initialProject.immersiveSettings.showProgressNav,
  );
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
  const [immersiveBuilder, setImmersiveBuilder] = useState<BrochureImmersiveBuilder>(
    initialProject.content.immersiveBuilder ?? createDefaultBrochureImmersiveBuilder(),
  );
  const [activeSectionId, setActiveSectionId] = useState(
    initialProject.content.sections[0]?.id ?? "",
  );
  const [sectionKindToAdd, setSectionKindToAdd] = useState<BrochureSectionKind | "">("");
  const [draggedImageId, setDraggedImageId] = useState("");
  const [draggedUnsplashPhoto, setDraggedUnsplashPhoto] = useState<UnsplashSearchPhoto | null>(
    null,
  );
  const [draggedSectionId, setDraggedSectionId] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("neutral");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [importingUnsplashPhotoId, setImportingUnsplashPhotoId] = useState("");
  const [deletingAssetId, setDeletingAssetId] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<UnsplashSearchPhoto[]>([]);
  const [unsplashError, setUnsplashError] = useState("");
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
  const historyRef = useRef<BrochureHistorySnapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const applyingHistoryRef = useRef(false);
  const [mapSuggestions, setMapSuggestions] = useState<MapSearchSuggestion[]>([]);
  const [mapSuggestionsQuery, setMapSuggestionsQuery] = useState("");
  const deferredLocationQuery = useDeferredValue(immersiveBuilder.locationAddress ?? "");
  const trimmedDeferredLocationQuery = deferredLocationQuery.trim();
  const canFetchLocationSuggestions = trimmedDeferredLocationQuery.length >= 3;
  const visibleLocationSuggestions =
    canFetchLocationSuggestions && mapSuggestionsQuery === trimmedDeferredLocationQuery
      ? mapSuggestions
      : [];

  useEffect(() => {
    setProject(initialProject);
    setTemplate(initialProject.template);
    setExperienceMode(initialProject.experienceMode);
    setImmersiveTheme(initialProject.immersiveSettings.theme);
    setImmersiveMotionPreset(initialProject.immersiveSettings.motionPreset);
    setShowImmersiveProgressNav(initialProject.immersiveSettings.showProgressNav);
    setFontFamily(initialProject.styleSettings.fontFamily);
    setOrientation(initialProject.styleSettings.orientation);
    setAccentColor(initialProject.styleSettings.accentColor);
    setBackgroundColor(initialProject.styleSettings.backgroundColor);
    setImageOrder(initialProject.content.imageOrder);
    setSections(initialProject.content.sections);
    setImmersiveBuilder(
      initialProject.content.immersiveBuilder ?? createDefaultBrochureImmersiveBuilder(),
    );
    setActiveSectionId(initialProject.content.sections[0]?.id ?? "");
    setDraggedImageId("");
    setDraggedUnsplashPhoto(null);
    setUnsplashError("");
    setHasCanvasSelection(false);
    setSidebarView("menu");
    setOpenPanelId("sections");
    setAutosaveStatus("idle");
    skipNextAutosaveRef.current = true;
    historyRef.current = [
      createHistorySnapshot(
        initialProject.template,
        initialProject.experienceMode,
        initialProject.immersiveSettings.theme,
        initialProject.immersiveSettings.motionPreset,
        initialProject.immersiveSettings.showProgressNav,
        initialProject.styleSettings.fontFamily,
        initialProject.styleSettings.orientation,
        initialProject.styleSettings.accentColor,
        initialProject.styleSettings.backgroundColor,
        initialProject.content.imageOrder,
        initialProject.content.sections,
        initialProject.content.immersiveBuilder ?? createDefaultBrochureImmersiveBuilder(),
      ),
    ];
    historyIndexRef.current = 0;
    applyingHistoryRef.current = false;
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
  const previewCoverSection = useMemo(
    () => getCoverSection(project, previewSections),
    [previewSections, project],
  );

  const previewImages = useMemo(
    () => orderedImages,
    [orderedImages],
  );
  const previewImmersiveSettings = useMemo(
    () => ({
      theme: immersiveTheme,
      motionPreset: immersiveMotionPreset,
      showProgressNav: showImmersiveProgressNav,
    }),
    [immersiveMotionPreset, immersiveTheme, showImmersiveProgressNav],
  );

  const draggedPreviewImage: BrochureDraggedImage | null = draggedUnsplashPhoto
    ? { source: "unsplash", photo: draggedUnsplashPhoto }
    : draggedImageId
      ? { source: "library", imageId: draggedImageId }
      : null;

  const handleDropImageIntoImmersive = async (
    sectionId: string,
    image: BrochureDraggedImage,
    imageIndex = 0,
  ) => {
    const addLibraryImage = (imageId: string) => {
      updateSectionById(sectionId, (section) => {
        const currentIds = [...section.imageIds];
        const nextIds = currentIds.filter((id) => id !== imageId);
        const index = Math.max(0, Math.min(imageIndex, 24));
        while (nextIds.length <= index) nextIds.push("");
        nextIds[index] = imageId;
        const cleaned = nextIds.filter((id, idx) => idx === index || Boolean(id));
        return { ...section, imageIds: cleaned };
      });
    };

    if (image.source === "library") {
      addLibraryImage(image.imageId);
      return;
    }

    setImportingUnsplashPhotoId(image.photo.id);
    setFeedbackTone("neutral");
    setFeedbackMessage("Importing Unsplash image...");

    try {
      const response = await fetch(
        `/api/brochure/projects/${project.brochureId}/assets/unsplash`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ photo: image.photo }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to import Unsplash image."),
        );
      }

      const payload = (await response.json()) as {
        project?: BrochureProject;
        assetId?: string;
      };

      if (!payload.project || !payload.assetId) {
        throw new Error("Failed to import Unsplash image.");
      }

      hydrateFromProject(payload.project);
      addLibraryImage(payload.assetId);
      setFeedbackTone("success");
      setFeedbackMessage("Unsplash image added to the library.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to import Unsplash image.",
      );
    } finally {
      setImportingUnsplashPhotoId("");
      setDraggedUnsplashPhoto(null);
    }
  };

  const hydrateFromProject = (nextProject: BrochureProject) => {
    skipNextAutosaveRef.current = true;
    setProject(nextProject);
    setTemplate(nextProject.template);
    setExperienceMode(nextProject.experienceMode);
    setImmersiveTheme(nextProject.immersiveSettings.theme);
    setImmersiveMotionPreset(nextProject.immersiveSettings.motionPreset);
    setShowImmersiveProgressNav(nextProject.immersiveSettings.showProgressNav);
    setFontFamily(nextProject.styleSettings.fontFamily);
    setOrientation(nextProject.styleSettings.orientation);
    setAccentColor(nextProject.styleSettings.accentColor);
    setBackgroundColor(nextProject.styleSettings.backgroundColor);
    setImageOrder(nextProject.content.imageOrder);
    setSections(nextProject.content.sections);
    setImmersiveBuilder(
      nextProject.content.immersiveBuilder ?? createDefaultBrochureImmersiveBuilder(),
    );
    setActiveSectionId(nextProject.content.sections[0]?.id ?? "");
  };

  const applyHistorySnapshot = (snapshot: BrochureHistorySnapshot) => {
    applyingHistoryRef.current = true;
    skipNextAutosaveRef.current = false;
    setTemplate(snapshot.template);
    setExperienceMode(snapshot.experienceMode);
    setImmersiveTheme(snapshot.immersiveTheme);
    setImmersiveMotionPreset(snapshot.immersiveMotionPreset);
    setShowImmersiveProgressNav(snapshot.showImmersiveProgressNav);
    setFontFamily(snapshot.fontFamily);
    setOrientation(snapshot.orientation);
    setAccentColor(snapshot.accentColor);
    setBackgroundColor(snapshot.backgroundColor);
    setImageOrder(snapshot.imageOrder);
    setSections(snapshot.sections);
    setImmersiveBuilder(snapshot.immersiveBuilder);
    setActiveSectionId(snapshot.sections[0]?.id ?? "");
    window.setTimeout(() => {
      applyingHistoryRef.current = false;
    }, 0);
  };

  useEffect(() => {
    const snapshot = createHistorySnapshot(
      template,
      experienceMode,
      immersiveTheme,
      immersiveMotionPreset,
      showImmersiveProgressNav,
      fontFamily,
      orientation,
      accentColor,
      backgroundColor,
      imageOrder,
      sections,
      immersiveBuilder,
    );
    const serializedSnapshot = JSON.stringify(snapshot);
    const currentIndex = historyIndexRef.current;
    const currentSnapshot = historyRef.current[currentIndex];
    if (currentSnapshot && JSON.stringify(currentSnapshot) === serializedSnapshot) {
      return;
    }

    if (applyingHistoryRef.current) {
      return;
    }

    const nextHistory = historyRef.current.slice(0, currentIndex + 1);
    nextHistory.push(snapshot);
    historyRef.current = nextHistory.slice(-80);
    historyIndexRef.current = historyRef.current.length - 1;
  }, [
    accentColor,
    backgroundColor,
    experienceMode,
    fontFamily,
    imageOrder,
    immersiveBuilder,
    immersiveMotionPreset,
    immersiveTheme,
    orientation,
    sections,
    showImmersiveProgressNav,
    template,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (autosaveStatus === "saving") return;

      void fetch(`/api/brochure/projects/${project.brochureId}`)
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as { project?: BrochureProject };
        })
        .then((payload) => {
          if (!payload?.project || !payload.project.updatedAt) return;
          if (project.updatedAt && payload.project.updatedAt <= project.updatedAt) return;
          hydrateFromProject(payload.project);
          setFeedbackTone("success");
          setFeedbackMessage("Remote changes synced.");
        })
        .catch(() => {
          // Silent polling failures keep the editor responsive.
        });
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [autosaveStatus, project]);

  useEffect(() => {
    if (experienceMode !== "immersive") return;
    if (!canFetchLocationSuggestions) {
      setMapSuggestions([]);
      setMapSuggestionsQuery("");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetch(`/api/maps/search?q=${encodeURIComponent(trimmedDeferredLocationQuery)}`, {
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
          setMapSuggestionsQuery(trimmedDeferredLocationQuery);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          console.error(error);
          setMapSuggestions([]);
          setMapSuggestionsQuery(trimmedDeferredLocationQuery);
        });
    }, 240);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [
    canFetchLocationSuggestions,
    experienceMode,
    trimmedDeferredLocationQuery,
  ]);

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
        experienceMode,
        immersiveTheme,
        immersiveMotionPreset,
        showImmersiveProgressNav,
        fontFamily,
        orientation,
        accentColor,
        backgroundColor,
        imageOrder,
        sections,
        immersiveBuilder,
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
        .then((payload) => {
          if (payload?.project) {
            hydrateFromProject(payload.project);
          }
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
    experienceMode,
    fontFamily,
    imageOrder,
    immersiveMotionPreset,
    immersiveTheme,
    orientation,
    project,
    sections,
    showImmersiveProgressNav,
    template,
    immersiveBuilder,
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

  const handleSearchUnsplash = async () => {
    const query = unsplashQuery.trim();
    if (query.length < 2) {
      setUnsplashResults([]);
      setUnsplashError("Enter at least 2 characters.");
      return;
    }

    setIsSearchingUnsplash(true);
    setUnsplashError("");

    try {
      const response = await fetch(`/api/unsplash/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to search Unsplash."),
        );
      }

      const payload = (await response.json()) as {
        items?: UnsplashSearchPhoto[];
      };
      setUnsplashResults(payload.items ?? []);
    } catch (error) {
      setUnsplashResults([]);
      setUnsplashError(
        error instanceof Error ? error.message : "Failed to search Unsplash.",
      );
    } finally {
      setIsSearchingUnsplash(false);
    }
  };

  const appendCanvasPhotoItem = (sectionId: string, imageId: string) => {
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

  const handleAddImageToCanvas = async (
    sectionId: string,
    image: BrochureDraggedImage,
  ) => {
    if (image.source === "library") {
      return appendCanvasPhotoItem(sectionId, image.imageId);
    }

    setImportingUnsplashPhotoId(image.photo.id);
    setFeedbackTone("neutral");
    setFeedbackMessage("Importing Unsplash image...");

    try {
      const response = await fetch(
        `/api/brochure/projects/${project.brochureId}/assets/unsplash`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ photo: image.photo }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to import Unsplash image."),
        );
      }

      const payload = (await response.json()) as {
        project?: BrochureProject;
        assetId?: string;
      };

      if (!payload.project || !payload.assetId) {
        throw new Error("Failed to import Unsplash image.");
      }

      hydrateFromProject(payload.project);
      const nextItem = createCanvasPhotoItem(
        payload.assetId,
        getMaxCanvasLayer(
          sections.find((section) => section.id === sectionId)?.layoutItems ?? [],
        ) + 1,
      );

      setSections((current) =>
        current.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                layoutItems: [...section.layoutItems, nextItem],
              }
            : section,
        ),
      );
      setActiveSectionId(sectionId);
      setFeedbackTone("success");
      setFeedbackMessage("Unsplash image added to the library and preview.");
      return nextItem.id;
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to import Unsplash image.",
      );
      return null;
    } finally {
      setImportingUnsplashPhotoId("");
      setDraggedUnsplashPhoto(null);
    }
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

  const updateImmersiveBuilder = (
    updater: (current: BrochureImmersiveBuilder) => BrochureImmersiveBuilder,
  ) => {
    setImmersiveBuilder((current) => updater(current));
  };

  const toggleImmersiveSection = (key: BrochureImmersiveSectionKey) => {
    updateImmersiveBuilder((current) => {
      const hasSection = current.selectedSections.includes(key);
      const nextSelectedSections = hasSection
        ? current.selectedSections.filter((entry) => entry !== key)
        : [...current.selectedSections, key];

      return {
        ...current,
        selectedSections: nextSelectedSections,
      };
    });
  };

  const handleGenerateImmersiveSections = () => {
    const nextSections = generateBrochureImmersiveSections(
      project.name,
      immersiveBuilder,
      orderedImageIds,
    );
    setImmersiveMotionPreset(
      immersiveBuilder.animationLevel === "minimal"
        ? "soft"
        : immersiveBuilder.animationLevel === "cinematic"
          ? "bold"
          : "cinematic",
    );
    setImmersiveTheme(
      immersiveBuilder.visualStyle === "luxury-minimal"
        ? "editorial"
        : immersiveBuilder.visualStyle === "warm-lifestyle"
          ? "warm"
          : "light",
    );
    setExperienceMode("immersive");
    setSections(nextSections);
    setActiveSectionId(nextSections[0]?.id ?? "");
    setOpenPanelId("edit");
    setFeedbackTone("success");
    setFeedbackMessage("Cinematic page structure generated.");
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    if (!snapshot) return;
    applyHistorySnapshot(snapshot);
    setFeedbackTone("success");
    setFeedbackMessage("Undo applied.");
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    if (!snapshot) return;
    applyHistorySnapshot(snapshot);
    setFeedbackTone("success");
    setFeedbackMessage("Redo applied.");
  };

  const applyLocationSuggestion = (suggestion: MapSearchSuggestion) => {
    updateImmersiveBuilder((current) => ({
      ...current,
      locationAddress: suggestion.label,
      locationLatitude: suggestion.latitude,
      locationLongitude: suggestion.longitude,
    }));
    setMapSuggestions([]);
    setMapSuggestionsQuery("");
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
      experienceMode,
      immersiveTheme,
      immersiveMotionPreset,
      showImmersiveProgressNav,
      fontFamily,
      orientation,
      accentColor,
      backgroundColor,
      imageOrder,
      sections,
      immersiveBuilder,
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
  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  return (
    <section className="brochureStudioShell">
      <header className="brochureStudioHeader">
        <div className="projectFeedbackIntro">
          <p className="projectFeedbackEyebrow">myBrochure</p>
          <h1 className="projectFeedbackTitle">{project.name}</h1>
          <p className="projectFeedbackVersionMeta">
            {experienceMode === "immersive"
              ? "Build a cinematic, scroll-driven teaser from your validated visuals."
              : "Add structured sections, assign the right visuals, then generate a polished brochure instantly."}
          </p>
        </div>

        <div className="brochureStudioToolbar">
          <button
            className="projectFeedbackAction"
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo"
          >
            ← Undo
          </button>
          <button
            className="projectFeedbackAction"
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo"
          >
            Redo →
          </button>
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

        <div
          className="brochureExperienceTabs"
          role="tablist"
          aria-label="myBrochure experience"
        >
          <button
            className="brochureExperienceTab"
            type="button"
            role="tab"
            aria-selected={experienceMode === "brochure"}
            data-active={experienceMode === "brochure" ? "true" : "false"}
            onClick={() => {
              setHasCanvasSelection(false);
              setSidebarView("menu");
              setExperienceMode("brochure");
            }}
          >
            myBrochure
          </button>
          <button
            className="brochureExperienceTab"
            type="button"
            role="tab"
            aria-selected={experienceMode === "immersive"}
            data-active={experienceMode === "immersive" ? "true" : "false"}
            onClick={() => {
              setHasCanvasSelection(false);
              setSidebarView("menu");
              setExperienceMode("immersive");
            }}
          >
            myBrochure Cinématique
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
        <aside ref={controlsRef} className="brochureStudioControls" data-density="compact">
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

                  {experienceMode === "immersive" ? (
                    <div className="brochureImmersiveControls">
                      <label className="projectFeedbackField">
                        <span>Theme</span>
                        <select
                          className="projectFeedbackInput"
                          value={immersiveTheme}
                          onChange={(event) =>
                            setImmersiveTheme(
                              event.target.value as BrochureImmersiveTheme,
                            )
                          }
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="warm">Warm</option>
                          <option value="editorial">Editorial</option>
                        </select>
                      </label>

                      <label className="projectFeedbackField">
                        <span>Motion</span>
                        <select
                          className="projectFeedbackInput"
                          value={immersiveMotionPreset}
                          onChange={(event) =>
                            setImmersiveMotionPreset(
                              event.target.value as BrochureImmersiveMotionPreset,
                            )
                          }
                        >
                          <option value="soft">Soft</option>
                          <option value="cinematic">Cinematic</option>
                          <option value="bold">Bold</option>
                        </select>
                      </label>

                      <label className="brochureImmersiveToggle">
                        <input
                          type="checkbox"
                          checked={showImmersiveProgressNav}
                          onChange={(event) =>
                            setShowImmersiveProgressNav(event.target.checked)
                          }
                        />
                        <span>Show chapter navigation</span>
                      </label>
                    </div>
                  ) : null}

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

                {experienceMode === "immersive" ? (
                  <BrochureSidebarPanel
                    panelId="cinematic"
                    title="myBrochure Cinematique"
                    isOpen={openPanelId === "cinematic"}
                    onToggle={() => togglePanel("cinematic")}
                  >
                    <div className="brochureImmersiveBuilderGrid">
                      <div className="brochureImmersiveBuilderCard">
                        <p className="projectFeedbackVersionMeta">Sections</p>
                        <div className="brochureImmersiveChecklist">
                          {immersiveSectionOptions.map((option) => (
                            <label
                              key={option.key}
                              className="brochureImmersiveChecklistItem"
                            >
                              <input
                                type="checkbox"
                                checked={immersiveBuilder.selectedSections.includes(option.key)}
                                onChange={() => toggleImmersiveSection(option.key)}
                              />
                              <span>{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="brochureImmersiveBuilderCard">
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

                        <div className="brochureImmersiveBuilderRow">
                          <label className="projectFeedbackField">
                            <span>Visual direction</span>
                            <select
                              className="projectFeedbackInput"
                              value={immersiveBuilder.visualStyle}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  visualStyle: event.target.value as BrochureImmersiveBuilder["visualStyle"],
                                }))
                              }
                            >
                              <option value="luxury-minimal">Luxury minimal</option>
                              <option value="modern-real-estate">Modern real estate</option>
                              <option value="warm-lifestyle">Lifestyle chaleureux</option>
                            </select>
                          </label>

                          <label className="projectFeedbackField">
                            <span>Animation</span>
                            <select
                              className="projectFeedbackInput"
                              value={immersiveBuilder.animationLevel}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  animationLevel: event.target.value as BrochureImmersiveBuilder["animationLevel"],
                                }))
                              }
                            >
                              <option value="minimal">Minimal</option>
                              <option value="subtle">Subtil</option>
                              <option value="cinematic">Cinematique</option>
                            </select>
                          </label>
                        </div>

                        <label className="projectFeedbackField">
                          <span>Hero image</span>
                          <div className="brochureImmersiveImagePicker">
                            <button
                              className="brochureImmersiveImagePickerOption"
                              type="button"
                              data-active={immersiveBuilder.heroImageId === "" ? "true" : "false"}
                              onClick={() =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  heroImageId: "",
                                }))
                              }
                            >
                              Auto
                            </button>
                            {orderedImages.map((image) => (
                              <button
                                key={image.id}
                                className="brochureImmersiveImagePickerOption"
                                type="button"
                                data-active={immersiveBuilder.heroImageId === image.id ? "true" : "false"}
                                onClick={() =>
                                  updateImmersiveBuilder((current) => ({
                                    ...current,
                                    heroImageId: image.id,
                                  }))
                                }
                              >
                                <img src={image.url} alt={image.label} loading="lazy" decoding="async" />
                                <span>{image.label}</span>
                              </button>
                            ))}
                          </div>
                        </label>

                        {immersiveBuilder.selectedSections.includes("gallery") ? (
                          <label className="projectFeedbackField">
                            <span>Gallery images</span>
                            <div className="brochureImmersiveImagePicker brochureImmersiveImagePickerMulti">
                              {orderedImages.map((image) => {
                                const isSelected = immersiveBuilder.galleryImageIds.includes(image.id);
                                return (
                                  <button
                                    key={image.id}
                                    className="brochureImmersiveImagePickerOption"
                                    type="button"
                                    data-active={isSelected ? "true" : "false"}
                                    onClick={() =>
                                      updateImmersiveBuilder((current) => {
                                        const next = isSelected
                                          ? current.galleryImageIds.filter((id) => id !== image.id)
                                          : [...current.galleryImageIds, image.id];
                                        return { ...current, galleryImageIds: next };
                                      })
                                    }
                                  >
                                    <img src={image.url} alt={image.label} loading="lazy" decoding="async" />
                                    <span>{image.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </label>
                        ) : null}
                      </div>

                      {immersiveBuilder.selectedSections.includes("description") ? (
                        <div className="brochureImmersiveBuilderCard">
                          <label className="projectFeedbackField">
                            <span>Description title</span>
                            <input
                              className="projectFeedbackInput"
                              type="text"
                              value={immersiveBuilder.descriptionTitle}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  descriptionTitle: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="projectFeedbackField">
                            <span>Description</span>
                            <textarea
                              className="projectFeedbackTextarea brochureStudioTextarea"
                              value={immersiveBuilder.descriptionBody}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  descriptionBody: event.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>
                      ) : null}

                      {immersiveBuilder.selectedSections.includes("key-points") ? (
                        <div className="brochureImmersiveBuilderCard">
                          <label className="projectFeedbackField">
                            <span>Key points title</span>
                            <input
                              className="projectFeedbackInput"
                              type="text"
                              value={immersiveBuilder.keyPointsTitle}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  keyPointsTitle: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="projectFeedbackField">
                            <span>Key points</span>
                            <textarea
                              className="projectFeedbackTextarea brochureStudioTextarea"
                              value={serializeLines(immersiveBuilder.keyPoints)}
                              placeholder="One point per line"
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  keyPoints: parseLines(event.target.value),
                                }))
                              }
                            />
                          </label>
                        </div>
                      ) : null}

                      {immersiveBuilder.selectedSections.includes("video") ? (
                        <div className="brochureImmersiveBuilderCard">
                          <label className="projectFeedbackField">
                            <span>Video URL</span>
                            <input
                              className="projectFeedbackInput"
                              type="url"
                              value={immersiveBuilder.videoUrl}
                              placeholder="https://..."
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  videoUrl: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="projectFeedbackField">
                            <span>Video integration</span>
                            <select
                              className="projectFeedbackInput"
                              value={immersiveBuilder.videoMode}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  videoMode: event.target.value as BrochureImmersiveVideoMode,
                                }))
                              }
                            >
                              <option value="background">Background</option>
                              <option value="section">Dedicated section</option>
                            </select>
                          </label>
                        </div>
                      ) : null}

                      {immersiveBuilder.selectedSections.includes("location") ? (
                        <div className="brochureImmersiveBuilderCard">
                          <label className="projectFeedbackField">
                            <span>Location title</span>
                            <input
                              className="projectFeedbackInput"
                              type="text"
                              value={immersiveBuilder.locationTitle}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  locationTitle: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="projectFeedbackField">
                            <span>Address / city</span>
                            <div className="brochureImmersiveAddressField">
                              <input
                                className="projectFeedbackInput"
                                type="text"
                                value={immersiveBuilder.locationAddress}
                                placeholder="1600 Amphitheatre Parkway, Mountain View"
                                onChange={(event) =>
                                  updateImmersiveBuilder((current) => ({
                                    ...current,
                                    locationAddress: event.target.value,
                                    locationLatitude: null,
                                    locationLongitude: null,
                                  }))
                                }
                              />
                              {visibleLocationSuggestions.length > 0 ? (
                                <div className="brochureImmersiveAddressSuggestions" role="listbox">
                                  {visibleLocationSuggestions.map((suggestion) => (
                                    <button
                                      key={suggestion.label}
                                      className="brochureImmersiveAddressSuggestion"
                                      type="button"
                                      onClick={() => applyLocationSuggestion(suggestion)}
                                    >
                                      {suggestion.label}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </label>

                          <div className="brochureImmersiveBuilderRow">
                            <label className="projectFeedbackField">
                              <span>Map style</span>
                              <select
                                className="projectFeedbackInput"
                                value={immersiveBuilder.locationMapStyle}
                                onChange={(event) =>
                                  updateImmersiveBuilder((current) => ({
                                    ...current,
                                    locationMapStyle: event.target.value as BrochureImmersiveBuilder["locationMapStyle"],
                                  }))
                                }
                              >
                                <option value="minimalMono">Minimal mono</option>
                                <option value="minimalWarm">Minimal warm</option>
                                <option value="minimalBlue">Minimal blue</option>
                                <option value="color">Color</option>
                                <option value="dark">Dark</option>
                              </select>
                            </label>
                            <label className="projectFeedbackField">
                              <span>Zoom</span>
                              <input
                                className="projectFeedbackInput"
                                type="number"
                                min={1}
                                max={20}
                                value={immersiveBuilder.locationZoom}
                                onChange={(event) =>
                                  updateImmersiveBuilder((current) => ({
                                    ...current,
                                    locationZoom: Number(event.target.value) || 14,
                                  }))
                                }
                              />
                            </label>
                          </div>

                          {immersiveBuilder.locationLatitude != null &&
                          immersiveBuilder.locationLongitude != null ? (
                            <div className="brochureImmersiveMapPreview">
                              <BrochureMapCanvas
                                latitude={immersiveBuilder.locationLatitude}
                                longitude={immersiveBuilder.locationLongitude}
                                zoom={immersiveBuilder.locationZoom}
                                mapStyle={immersiveBuilder.locationMapStyle}
                                interactive={false}
                              />
                            </div>
                          ) : null}
                          <label className="projectFeedbackField">
                            <span>Neighborhood description</span>
                            <textarea
                              className="projectFeedbackTextarea brochureStudioTextarea"
                              value={immersiveBuilder.locationNeighborhood}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  locationNeighborhood: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="projectFeedbackField">
                            <span>Points of interest</span>
                            <textarea
                              className="projectFeedbackTextarea brochureStudioTextarea"
                              value={serializeLines(immersiveBuilder.locationPoints)}
                              placeholder="One point per line"
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  locationPoints: parseLines(event.target.value),
                                }))
                              }
                            />
                          </label>
                        </div>
                      ) : null}

                      {immersiveBuilder.selectedSections.includes("lifestyle") ? (
                        <div className="brochureImmersiveBuilderCard">
                          <label className="projectFeedbackField">
                            <span>Lifestyle title</span>
                            <input
                              className="projectFeedbackInput"
                              type="text"
                              value={immersiveBuilder.lifestyleTitle}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  lifestyleTitle: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="projectFeedbackField">
                            <span>Lifestyle / ambiance</span>
                            <textarea
                              className="projectFeedbackTextarea brochureStudioTextarea"
                              value={immersiveBuilder.lifestyleBody}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  lifestyleBody: event.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>
                      ) : null}

                      {immersiveBuilder.selectedSections.includes("cta") ? (
                        <div className="brochureImmersiveBuilderCard">
                          <label className="projectFeedbackField">
                            <span>CTA title</span>
                            <input
                              className="projectFeedbackInput"
                              type="text"
                              value={immersiveBuilder.ctaTitle}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  ctaTitle: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="projectFeedbackField">
                            <span>CTA body</span>
                            <textarea
                              className="projectFeedbackTextarea brochureStudioTextarea"
                              value={immersiveBuilder.ctaBody}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  ctaBody: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="projectFeedbackField">
                            <span>CTA button label</span>
                            <input
                              className="projectFeedbackInput"
                              type="text"
                              value={immersiveBuilder.ctaButtonLabel}
                              onChange={(event) =>
                                updateImmersiveBuilder((current) => ({
                                  ...current,
                                  ctaButtonLabel: event.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>
                      ) : null}

                      <button
                        className="projectFeedbackAction projectFeedbackActionDark"
                        type="button"
                        onClick={handleGenerateImmersiveSections}
                      >
                        Generate cinematic page
                      </button>
                    </div>
                  </BrochureSidebarPanel>
                ) : null}

                <div className="brochureSidebarDivider" aria-hidden="true" />

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

                  <div className="brochureImageList brochureImageListGrid">
                    {orderedImages.map((image, index) => (
                      <article
                        key={image.id}
                        className="brochureImageRow"
                        draggable
                        onDragStart={() => {
                          setDraggedUnsplashPhoto(null);
                          setDraggedImageId(image.id);
                        }}
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

                <BrochureSidebarPanel
                  panelId="unsplash"
                  title="Unsplash Pictures"
                  isOpen={openPanelId === "unsplash"}
                  onToggle={() => togglePanel("unsplash")}
                >
                  <form
                    className="brochureUnsplashSearch"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleSearchUnsplash();
                    }}
                  >
                    <input
                      className="projectFeedbackInput"
                      type="search"
                      value={unsplashQuery}
                      onChange={(event) => setUnsplashQuery(event.target.value)}
                      placeholder="Search photos..."
                    />
                    <button
                      className="projectFeedbackAction"
                      type="submit"
                      disabled={isSearchingUnsplash}
                    >
                      {isSearchingUnsplash ? "Searching..." : "Search"}
                    </button>
                  </form>

                  <p className="projectFeedbackVersionMeta">
                    Drag a photo directly onto the preview to import it into the
                    project.
                  </p>

                  {unsplashError ? (
                    <p className="projectFeedbackMessage projectFeedbackMessageError">
                      {unsplashError}
                    </p>
                  ) : null}

                  <div className="brochureImageList brochureImageListGrid">
                    {unsplashResults.map((photo, index) => (
                      <article
                        key={photo.id}
                        className="brochureImageRow brochureUnsplashRow"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "copy";
                          event.dataTransfer.setData("text/plain", photo.id);
                          setDraggedImageId("");
                          setDraggedUnsplashPhoto(photo);
                        }}
                        onDragEnd={() => setDraggedUnsplashPhoto(null)}
                      >
                        <div className="brochureImageRowMedia">
                          <img
                            src={photo.thumbUrl}
                            alt={photo.alt || photo.description || "Unsplash image"}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>

                        <div className="brochureImageRowBody">
                          <div className="brochureImageRowCopy">
                            <strong>{photo.description || `Unsplash ${index + 1}`}</strong>
                            <span>
                              {importingUnsplashPhotoId === photo.id
                                ? "Importing..."
                                : "Drag into the preview"}
                            </span>
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

                    {experienceMode === "immersive" ? (
                      <>
                        <label className="brochureImmersiveToggle">
                          <input
                            type="checkbox"
                            checked={activeSection.isHidden === true}
                            onChange={(event) =>
                              updateActiveSection((section) => ({
                                ...section,
                                isHidden: event.target.checked,
                              }))
                            }
                          />
                          <span>Hide this section from the cinematic page</span>
                        </label>

                        <label className="projectFeedbackField">
                          <span>Immersive layout</span>
                          <select
                            className="projectFeedbackInput"
                            value={activeSection.immersiveLayout ?? "media-left"}
                            onChange={(event) =>
                              updateActiveSection((section) => ({
                                ...section,
                                immersiveLayout: event.target.value as NonNullable<
                                  BrochureSection["immersiveLayout"]
                                >,
                              }))
                            }
                          >
                            <option value="media-left">Media left</option>
                            <option value="media-right">Media right</option>
                            <option value="full-bleed">Full bleed</option>
                          </select>
                        </label>

                        {(activeSection.immersiveVariant === "key-points" ||
                          activeSection.immersiveVariant === "location") ? (
                          <label className="projectFeedbackField">
                            <span>Points list</span>
                            <textarea
                              className="projectFeedbackTextarea brochureStudioTextarea"
                              value={serializeLines(activeSection.immersiveKeyPoints ?? [])}
                              placeholder="One point per line"
                              onChange={(event) =>
                                updateActiveSection((section) => ({
                                  ...section,
                                  immersiveKeyPoints: parseLines(event.target.value),
                                }))
                              }
                            />
                          </label>
                        ) : null}

                        {activeSection.immersiveVariant === "video" ? (
                          <>
                            <label className="projectFeedbackField">
                              <span>Video URL</span>
                              <input
                                className="projectFeedbackInput"
                                type="url"
                                value={activeSection.immersiveVideoUrl ?? ""}
                                placeholder="https://..."
                                onChange={(event) =>
                                  updateActiveSection((section) => ({
                                    ...section,
                                    immersiveVideoUrl: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <label className="projectFeedbackField">
                              <span>Video mode</span>
                              <select
                                className="projectFeedbackInput"
                                value={activeSection.immersiveVideoMode ?? "section"}
                                onChange={(event) =>
                                  updateActiveSection((section) => ({
                                    ...section,
                                    immersiveVideoMode:
                                      event.target.value as BrochureImmersiveVideoMode,
                                  }))
                                }
                              >
                                <option value="background">Background</option>
                                <option value="section">Dedicated section</option>
                              </select>
                            </label>
                          </>
                        ) : null}
                      </>
                    ) : null}

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
            {experienceMode === "immersive" ? (
              <BrochureImmersive
                projectName={project.name}
                title={previewCoverSection.title}
                subtitle={previewCoverSection.subtitle}
                body={previewCoverSection.body}
                styleSettings={{
                  ...project.styleSettings,
                  fontFamily,
                  orientation,
                  accentColor,
                  backgroundColor,
                }}
                immersiveSettings={previewImmersiveSettings}
                sections={previewSections}
                images={previewImages}
                pdfHref="?pdf=1"
                editable
                draggedImage={draggedPreviewImage}
                onSelectSection={(sectionId) => {
                  setActiveSectionId(sectionId);
                  setOpenPanelId("edit");
                }}
                onDropImage={(sectionId, image, imageIndex) =>
                  void handleDropImageIntoImmersive(sectionId, image, imageIndex ?? 0)
                }
                onUpdateSection={(sectionId, updater) => updateSectionById(sectionId, updater)}
              />
            ) : (
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
                draggedImage={draggedPreviewImage}
                selectionPanelTarget={elementEditorPortalTarget}
                onSelectionStateChange={setHasCanvasSelection}
                onActiveSectionChange={setActiveSectionId}
                onAddImageToCanvas={handleAddImageToCanvas}
                onUpdateCanvasItem={handleUpdateCanvasItem}
                onUpdateCanvasItems={handleUpdateCanvasItems}
                onDeleteCanvasItem={handleDeleteCanvasItem}
                onMoveCanvasItemLayer={handleMoveCanvasItemLayer}
              />
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
