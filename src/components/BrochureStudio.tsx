"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";

import {
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
type BrochureSidebarPanelId =
  | "template"
  | "sections"
  | "edit"
  | "library"
  | "style"
  | "elements";

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
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  description?: string;
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
        <h2 className="projectFeedbackVersionTitle">{title}</h2>
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
    const nextSection: BrochureSection = {
      ...section,
      title: section.title.trim() || definition?.defaultTitle || "Section",
      subtitle: section.subtitle.trim() || definition?.defaultSubtitle || "",
      body: section.body.trim() || definition?.defaultBody || "",
      imageIds: section.imageIds.filter((imageId) => orderedImageIds.includes(imageId)),
      layoutItems: sanitizeCanvasItems(section.kind, section.layoutItems),
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
      layoutItems: sanitizeCanvasItems(section.kind, section.layoutItems),
      socialLinks:
        section.kind === "final" ? normalizeSocialLinks(section.socialLinks) : undefined,
    };
  });
}

function getCoverSection(project: BrochureProject, sections: BrochureSection[]) {
  return (
    sections.find((section) => section.kind === "cover") ?? {
      id: "cover-fallback",
      kind: "cover" as const,
      title: project.title || project.name,
      subtitle: project.subtitle,
      body: project.body,
      imageIds: project.content.imageOrder.slice(0, 1),
    }
  );
}

function buildBrochureSavePayload(
  project: BrochureProject,
  template: BrochureTemplate,
  fontFamily: BrochureFontFamily,
  accentColor: string,
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
      accentColor,
      imageOrder: nextImageOrder,
      selectedImageIds,
      sections: nextSections,
    },
  };
}

export function BrochureStudio({ initialProject }: BrochureStudioProps) {
  const [project, setProject] = useState(initialProject);
  const [template, setTemplate] = useState<BrochureTemplate>(initialProject.template);
  const [fontFamily, setFontFamily] = useState<BrochureFontFamily>(
    initialProject.styleSettings.fontFamily,
  );
  const [accentColor, setAccentColor] = useState(
    initialProject.styleSettings.accentColor,
  );
  const [imageOrder, setImageOrder] = useState(initialProject.content.imageOrder);
  const [sections, setSections] = useState(initialProject.content.sections);
  const [activeSectionId, setActiveSectionId] = useState(
    initialProject.content.sections[0]?.id ?? "",
  );
  const [sectionKindToAdd, setSectionKindToAdd] = useState<BrochureSectionKind | "">("");
  const [draggedImageId, setDraggedImageId] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("neutral");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [openPanelId, setOpenPanelId] = useState<BrochureSidebarPanelId | null>("sections");
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveRequestIdRef = useRef(0);
  const skipNextAutosaveRef = useRef(true);

  useEffect(() => {
    setProject(initialProject);
    setTemplate(initialProject.template);
    setFontFamily(initialProject.styleSettings.fontFamily);
    setAccentColor(initialProject.styleSettings.accentColor);
    setImageOrder(initialProject.content.imageOrder);
    setSections(initialProject.content.sections);
    setActiveSectionId(initialProject.content.sections[0]?.id ?? "");
    setOpenPanelId("sections");
    setAutosaveStatus("idle");
    skipNextAutosaveRef.current = true;
  }, [initialProject]);

  useEffect(() => {
    if (sections.length === 0) {
      setActiveSectionId("");
      return;
    }

    if (!sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [activeSectionId, sections]);

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
    return BROCHURE_SECTION_DEFINITIONS.filter((definition) => !usedKinds.has(definition.kind));
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
    setAccentColor(nextProject.styleSettings.accentColor);
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
        accentColor,
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
    fontFamily,
    imageOrder,
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

  const assignImageToSection = (sectionId: string, imageId: string) => {
    updateSectionById(sectionId, (section) => {
      if (section.imageIds.includes(imageId)) {
        return section;
      }

      return {
        ...section,
        imageIds: orderedImageIds.filter(
          (orderedId) => orderedId === imageId || section.imageIds.includes(orderedId),
        ),
      };
    });

    setActiveSectionId(sectionId);
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

  const handleAddIconItem = (emoji: string) => {
    const targetSectionId = activeSectionId || sections[0]?.id;
    if (!targetSectionId) return;

    const nextItem = createCanvasTextItem(
      getMaxCanvasLayer(
        sections.find((section) => section.id === targetSectionId)?.layoutItems ?? [],
      ) + 1,
    );

    const iconItem = {
      ...nextItem,
      textContent: emoji,
      fontSize: 32,
    };

    updateSectionById(targetSectionId, (section) => ({
      ...section,
      layoutItems: [...section.layoutItems, iconItem],
    }));

    setActiveSectionId(targetSectionId);
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

  const handleMoveSection = (sectionId: string, direction: -1 | 1) => {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === sectionId);
      if (index === -1) return current;

      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [section] = next.splice(index, 1);
      next.splice(nextIndex, 0, section);
      return next;
    });
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
      accentColor,
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
          <a
            className="projectFeedbackAction"
            href={`/mybrochure/${project.projectId}/view`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Present →
          </a>
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
        <aside className="brochureStudioControls brochureBuilderPanel">
          <BrochureSidebarPanel
            title="Template"
            isOpen={openPanelId === "template"}
            onToggle={() => togglePanel("template")}
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
            <div className="brochureStudioToolbar">
              <button
                className="projectFeedbackAction"
                type="button"
                data-active={orientation === "landscape" ? "true" : "false"}
                onClick={() => setOrientation("landscape")}
              >
                Landscape
              </button>
              <button
                className="projectFeedbackAction"
                type="button"
                data-active={orientation === "portrait" ? "true" : "false"}
                onClick={() => setOrientation("portrait")}
              >
                Portrait
              </button>
            </div>
          </BrochureSidebarPanel>

          <BrochureSidebarPanel
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

                return (
                  <button
                    key={section.id}
                    className="brochureSectionTab"
                    type="button"
                    data-active={activeSectionId === section.id ? "true" : "false"}
                    onClick={() => {
                      setActiveSectionId(section.id);
                      setOpenPanelId("edit");
                    }}
                  >
                    <strong>{definition?.label ?? "Section"}</strong>
                    <span>{section.imageIds.length} image(s)</span>
                  </button>
                );
              })}
            </div>
          </BrochureSidebarPanel>

          {activeSection ? (
            <BrochureSidebarPanel
              title="Edit section"
              isOpen={openPanelId === "edit"}
              onToggle={() => togglePanel("edit")}
            >
              <div className="brochureSectionEditorActions">
                <button
                  className="projectFeedbackAction"
                  type="button"
                  onClick={() => handleMoveSection(activeSection.id, -1)}
                >
                  Up
                </button>
                <button
                  className="projectFeedbackAction"
                  type="button"
                  onClick={() => handleMoveSection(activeSection.id, 1)}
                >
                  Down
                </button>
                {activeSection.kind !== "cover" ? (
                  <button
                    className="projectFeedbackAction"
                    type="button"
                    onClick={() => handleRemoveSection(activeSection.id)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

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

              <label className="projectFeedbackField">
                <span>Background color</span>
                <input
                  className="brochureColorInput"
                  type="color"
                  value={activeSection.bgColor || "#ffffff"}
                  onChange={(event) =>
                    updateActiveSection((section) => ({
                      ...section,
                      bgColor: event.target.value,
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
                        <img src={image.url} alt={image.label} loading="lazy" decoding="async" />
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

          <BrochureSidebarPanel
            title="Image library"
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

              <label className="projectFeedbackUpload brochureStudioUpload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleLogoUpload(event)}
                  disabled={isUploadingLogo}
                />
                {isUploadingLogo ? "Uploading..." : "Upload logo"}
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
                      <span className="brochureImageOrderBadge">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </BrochureSidebarPanel>

          <BrochureSidebarPanel
            title="Style"
            isOpen={openPanelId === "style"}
            onToggle={() => togglePanel("style")}
          >
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
          </BrochureSidebarPanel>

          <BrochureSidebarPanel
            title="Éléments"
            isOpen={openPanelId === "elements"}
            onToggle={() => togglePanel("elements")}
          >
            <div className="brochureElementsRow">
              <span className="brochureElementsLabel">Shapes</span>
              <div className="brochureElementsButtonRow">
                {(["rectangle", "square", "circle", "line", "arrow"] as const).map((shapeType) => (
                  <button
                    key={shapeType}
                    className="brochureElementsBtn"
                    type="button"
                    onClick={() => {
                      const targetSectionId = activeSectionId || sections[0]?.id;
                      if (!targetSectionId) return;
                      handleAddDecorativeShape(targetSectionId, shapeType);
                    }}
                  >
                    {shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="brochureElementsRow">
              <span className="brochureElementsLabel">Text</span>
              <div className="brochureElementsButtonRow">
                <button
                  className="brochureElementsBtn"
                  type="button"
                  onClick={() => {
                    const targetSectionId = activeSectionId || sections[0]?.id;
                    if (!targetSectionId) return;
                    handleAddCanvasText(targetSectionId);
                  }}
                >
                  + Text
                </button>
                <button
                  className="brochureElementsBtn"
                  type="button"
                  onClick={() => handleAddIconItem("📍")}
                >
                  📍 Pin
                </button>
              </div>
            </div>

            <div className="brochureElementsRow">
              <span className="brochureElementsLabel">Icons</span>
              <div className="brochureElementsButtonRow">
                {["🏠", "🌳", "📚", "🚗", "⚓", "🏫", "⚽"].map((emoji) => (
                  <button
                    key={emoji}
                    className="brochureElementsBtn brochureElementsBtnIcon"
                    type="button"
                    onClick={() => handleAddIconItem(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </BrochureSidebarPanel>
        </aside>

        <section className="brochurePreviewShell brochureBuilderPreview">
          <div className="brochurePreviewSurface">
            <BrochurePreview
              projectName={project.name}
              template={template}
              styleSettings={{
                ...project.styleSettings,
                fontFamily,
                accentColor,
              }}
              sections={previewSections}
              images={previewImages}
              editable
              activeSectionId={activeSectionId}
              draggedImageId={draggedImageId}
              onActiveSectionChange={setActiveSectionId}
              onAssignImageToSection={assignImageToSection}
              onUpdateCanvasItem={handleUpdateCanvasItem}
              onAddDecorativeShape={handleAddDecorativeShape}
              onAddTextItem={handleAddCanvasText}
              onDeleteCanvasItem={handleDeleteCanvasItem}
              onMoveCanvasItemLayer={handleMoveCanvasItemLayer}
              orientation={orientation}
            />
          </div>
        </section>
      </div>
    </section>
  );
}
