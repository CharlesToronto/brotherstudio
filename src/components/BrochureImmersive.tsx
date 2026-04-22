"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { getBrochureSectionDefinition } from "@/lib/brochureSections";
import type {
  BrochureImageItem,
  BrochureImmersiveSettings,
  BrochureSection,
  BrochureStyleSettings,
} from "@/lib/brochureTypes";
import { BrochureMapCanvas } from "@/components/BrochureMapCanvas";
import type { BrochureDraggedImage } from "@/lib/unsplash";

type BrochureImmersiveProps = {
  projectName: string;
  title: string;
  subtitle: string;
  body: string;
  styleSettings: BrochureStyleSettings;
  immersiveSettings: BrochureImmersiveSettings;
  sections: BrochureSection[];
  images: BrochureImageItem[];
  pdfHref?: string;
  editable?: boolean;
  draggedImage?: BrochureDraggedImage | null;
  onSelectSection?: (sectionId: string) => void;
  onDropImage?: (sectionId: string, image: BrochureDraggedImage, imageIndex?: number) => void;
  onUpdateSection?: (sectionId: string, updater: (section: BrochureSection) => BrochureSection) => void;
};

function buildImageMap(images: BrochureImageItem[]) {
  return new Map(images.map((image) => [image.id, image]));
}

export function BrochureImmersive({
  projectName,
  title,
  subtitle,
  body,
  styleSettings,
  immersiveSettings,
  sections,
  images,
  pdfHref,
  editable = false,
  draggedImage,
  onSelectSection,
  onDropImage,
  onUpdateSection,
}: BrochureImmersiveProps) {
  const imageMap = useMemo(() => buildImageMap(images), [images]);
  const visibleSections = useMemo(
    () => sections.filter((section) => section.isHidden !== true),
    [sections],
  );
  const [activeSectionId, setActiveSectionId] = useState(visibleSections[0]?.id ?? "");
  const effectiveActiveSectionId = visibleSections.some((section) => section.id === activeSectionId)
    ? activeSectionId
    : visibleSections[0]?.id ?? "";

  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    images: BrochureImageItem[];
    index: number;
  }>({
    isOpen: false,
    images: [],
    index: 0,
  });

  const openLightbox = (items: BrochureImageItem[], index: number) => {
    setLightbox({
      isOpen: true,
      images: items,
      index: Math.max(0, Math.min(items.length - 1, index)),
    });
  };

  const closeLightbox = () => {
    setLightbox((current) => ({ ...current, isOpen: false }));
  };

  const moveLightbox = (delta: number) => {
    setLightbox((current) => {
      const count = current.images.length;
      if (!count) return current;
      const nextIndex = (current.index + delta + count) % count;
      return { ...current, index: nextIndex };
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-immersive-section-id]"),
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const sectionId = visible?.target.getAttribute("data-immersive-section-id");
        if (sectionId) {
          setActiveSectionId(sectionId);
        }
      },
      {
        threshold: [0.2, 0.4, 0.6, 0.8],
        rootMargin: "-10% 0px -10% 0px",
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [visibleSections]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!lightbox.isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveLightbox(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveLightbox(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightbox.isOpen]);

  const coverSection = visibleSections[0] ?? null;
  const heroImage = coverSection?.imageIds[0] ? imageMap.get(coverSection.imageIds[0]) : null;
  const pdfLabel = "Download brochure PDF";
  const canDrop = editable && Boolean(draggedImage) && Boolean(onDropImage);

  const handleDrop = (
    event: React.DragEvent<HTMLElement>,
    sectionId: string,
    imageIndex?: number,
  ) => {
    if (!canDrop || !draggedImage || !onDropImage) return;
    event.preventDefault();
    event.stopPropagation();
    onDropImage(sectionId, draggedImage, imageIndex);
  };

  const cycleLayout = (sectionId: string) => {
    if (!editable || !onUpdateSection) return;
    onUpdateSection(sectionId, (section) => {
      const next =
        section.immersiveLayout === "media-left"
          ? "media-right"
          : section.immersiveLayout === "media-right"
            ? "full-bleed"
            : "media-left";
      return { ...section, immersiveLayout: next };
    });
  };

  const cycleAspect = (sectionId: string) => {
    if (!editable || !onUpdateSection) return;
    onUpdateSection(sectionId, (section) => {
      const next =
        section.immersiveMediaAspect === "portrait"
          ? "square"
          : section.immersiveMediaAspect === "square"
            ? "landscape"
            : "portrait";
      return { ...section, immersiveMediaAspect: next };
    });
  };

  const aspectRatioFor = (section: BrochureSection) => {
    const aspect = section.immersiveMediaAspect ?? "portrait";
    if (aspect === "landscape") return "16 / 9";
    if (aspect === "square") return "1 / 1";
    return "4 / 5";
  };

  return (
    <section
      className="brochureImmersiveShell"
      data-theme={immersiveSettings.theme}
      data-motion={immersiveSettings.motionPreset}
      style={
        {
          "--immersive-accent-color": styleSettings.accentColor,
          "--immersive-background-color": styleSettings.backgroundColor,
          "--immersive-font-family": 'var(--brochure-font-family, "Helvetica Neue", Helvetica, Arial, sans-serif)',
        } as CSSProperties
      }
    >
      {immersiveSettings.showProgressNav ? (
        <nav className="brochureImmersiveNav" aria-label="Immersive sections">
          {visibleSections.map((section, index) => {
            const sectionLabel =
              getBrochureSectionDefinition(section.kind)?.label || `Section ${index + 1}`;

            return (
              <a
                key={section.id}
                className="brochureImmersiveNavItem"
                href={`#immersive-${section.id}`}
                data-active={effectiveActiveSectionId === section.id ? "true" : "false"}
              >
                <span className="brochureImmersiveNavIndex">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="brochureImmersiveNavLabel">
                  {section.title || sectionLabel}
                </span>
              </a>
            );
          })}
        </nav>
      ) : null}

      <header
        id={coverSection ? `immersive-${coverSection.id}` : undefined}
        className="brochureImmersiveHero"
        data-immersive-section-id={coverSection?.id ?? ""}
        onClick={editable && coverSection ? () => onSelectSection?.(coverSection.id) : undefined}
        onDragOver={canDrop ? (event) => event.preventDefault() : undefined}
        onDrop={coverSection ? (event) => handleDrop(event, coverSection.id, 0) : undefined}
      >
        {coverSection?.immersiveVariant === "video" && coverSection.immersiveVideoUrl ? (
          <div
            className="brochureImmersiveHeroMedia"
            onDragOver={canDrop ? (event) => event.preventDefault() : undefined}
            onDrop={coverSection ? (event) => handleDrop(event, coverSection.id, 0) : undefined}
          >
            <video
              src={coverSection.immersiveVideoUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        ) : heroImage ? (
          <div
            className="brochureImmersiveHeroMedia"
            onDragOver={canDrop ? (event) => event.preventDefault() : undefined}
            onDrop={coverSection ? (event) => handleDrop(event, coverSection.id, 0) : undefined}
          >
            <img src={heroImage.url} alt={heroImage.label} />
          </div>
        ) : null}
        <div className="brochureImmersiveHeroOverlay" />
        <div className="brochureImmersiveHeroInner">
          <p className="brochureImmersiveEyebrow">{projectName}</p>
          <h1 className="brochureImmersiveTitle">{title}</h1>
          {subtitle ? <p className="brochureImmersiveSubtitle">{subtitle}</p> : null}
          {body ? <p className="brochureImmersiveLead">{body}</p> : null}
        </div>
      </header>

      <div className="brochureImmersiveSections">
        {visibleSections.slice(1).map((section, index) => {
          const sectionImages = section.imageIds
            .map((imageId) => imageMap.get(imageId))
            .filter((image): image is BrochureImageItem => Boolean(image));
          const leadImage = sectionImages[0] ?? null;
          const chapterLabel =
            getBrochureSectionDefinition(section.kind)?.label ||
            `Section ${index + 2}`;

          return (
            <section
              key={section.id}
              id={`immersive-${section.id}`}
              className="brochureImmersiveSection"
              data-layout={
                section.immersiveLayout ??
                (index % 2 === 0 ? "media-left" : "media-right")
              }
              data-immersive-section-id={section.id}
              onClick={editable ? () => onSelectSection?.(section.id) : undefined}
              onDragOver={canDrop ? (event) => event.preventDefault() : undefined}
              onDrop={(event) => handleDrop(event, section.id)}
            >
              {editable ? (
                <div className="brochureImmersiveEditBar" aria-hidden="true">
                  <button
                    className="brochureImmersiveEditButton"
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      cycleLayout(section.id);
                    }}
                  >
                    Layout
                  </button>
                  <button
                    className="brochureImmersiveEditButton"
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      cycleAspect(section.id);
                    }}
                  >
                    Aspect
                  </button>
                </div>
              ) : null}
              <div className="brochureImmersiveSectionInner">
                <div className="brochureImmersiveSectionCopy">
                  <p className="brochureImmersiveSectionLabel">{chapterLabel}</p>
                  <h2 className="brochureImmersiveSectionTitle">
                    {section.title || chapterLabel}
                  </h2>
                  {section.subtitle ? (
                    <p className="brochureImmersiveSectionSubtitle">{section.subtitle}</p>
                  ) : null}
                  {section.body ? (
                    <p className="brochureImmersiveSectionBody">{section.body}</p>
                  ) : null}
                  {section.immersiveKeyPoints && section.immersiveKeyPoints.length > 0 ? (
                    <ul className="brochureImmersiveKeyPointList">
                      {section.immersiveKeyPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="brochureImmersiveSectionMedia">
                  {section.immersiveVariant === "video" && section.immersiveVideoUrl ? (
                    <figure className="brochureImmersiveFigure" style={{ aspectRatio: aspectRatioFor(section) }}>
                      <div className="brochureImmersiveVideoFrame">
                        <video
                          src={section.immersiveVideoUrl}
                          controls
                          muted
                          playsInline
                        />
                      </div>
                    </figure>
                  ) : section.immersiveVariant === "location" &&
                    typeof section.immersiveMapLatitude === "number" &&
                    typeof section.immersiveMapLongitude === "number" ? (
                    <figure className="brochureImmersiveFigure brochureImmersiveMapFigure" style={{ aspectRatio: aspectRatioFor(section) }}>
                      <BrochureMapCanvas
                        latitude={section.immersiveMapLatitude}
                        longitude={section.immersiveMapLongitude}
                        zoom={section.immersiveMapZoom ?? 14}
                        mapStyle={section.immersiveMapStyle ?? "minimalMono"}
                        interactive={false}
                      />
                    </figure>
                  ) : leadImage ? (
                    <figure
                      className="brochureImmersiveFigure"
                      style={{ aspectRatio: aspectRatioFor(section) }}
                      onDragOver={canDrop ? (event) => event.preventDefault() : undefined}
                      onDrop={(event) => handleDrop(event, section.id, 0)}
                    >
                      <button
                        className="brochureImmersiveMediaButton"
                        type="button"
                        onClick={() => openLightbox(sectionImages, 0)}
                        aria-label="Open image"
                      >
                        <img src={leadImage.url} alt={leadImage.label} />
                      </button>
                    </figure>
                  ) : (
                    <div
                      className="brochureImmersiveMediaPlaceholder"
                      style={{ aspectRatio: aspectRatioFor(section) }}
                      onDragOver={canDrop ? (event) => event.preventDefault() : undefined}
                      onDrop={(event) => handleDrop(event, section.id, 0)}
                    >
                      Add an image to strengthen this chapter.
                    </div>
                  )}

                  {section.immersiveVariant === "gallery" ? (
                    <div className="brochureImmersiveGalleryGrid">
                      {Array.from({ length: 4 }).map((_, slotIndex) => {
                        const image = sectionImages[slotIndex + 1] ?? null;
                        const imageKey = image?.id ?? `empty-${slotIndex}`;
                        return (
                          <figure
                            key={imageKey}
                            className={`brochureImmersiveThumb${
                              image ? "" : " brochureImmersiveThumbPlaceholder"
                            }`}
                            onDragOver={canDrop ? (event) => event.preventDefault() : undefined}
                            onDrop={(event) => handleDrop(event, section.id, slotIndex + 1)}
                          >
                            {image ? (
                              <button
                                className="brochureImmersiveMediaButton"
                                type="button"
                                onClick={() => openLightbox(sectionImages, slotIndex + 1)}
                                aria-label="Open image"
                              >
                                <img src={image.url} alt={image.label} />
                              </button>
                            ) : (
                              <div className="brochureImmersiveThumbEmpty">Drop image</div>
                            )}
                          </figure>
                        );
                      })}
                    </div>
                  ) : sectionImages.length > 1 ? (
                    <div className="brochureImmersiveThumbGrid">
                      {sectionImages.slice(1, 4).map((image, thumbIndex) => (
                        <figure key={image.id} className="brochureImmersiveThumb">
                          <button
                            className="brochureImmersiveMediaButton"
                            type="button"
                            onClick={() => openLightbox(sectionImages, thumbIndex + 1)}
                            aria-label="Open image"
                          >
                            <img src={image.url} alt={image.label} />
                          </button>
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {pdfHref ? (
        <footer className="brochureImmersiveCta">
          <div className="brochureImmersiveCtaInner">
            <p className="brochureImmersiveCtaEyebrow">Full dossier</p>
            <h2 className="brochureImmersiveCtaTitle">Download the complete brochure PDF</h2>
            <p className="brochureImmersiveCtaText">
              This cinematic page stays light on purpose. The full technical details are available
              in the brochure PDF.
            </p>
            <a className="brochureImmersiveCtaButton" href={pdfHref} target="_blank" rel="noreferrer">
              {pdfLabel}
            </a>
          </div>
        </footer>
      ) : null}

      {lightbox.isOpen && lightbox.images[lightbox.index] ? (
        <div
          className="brochureLightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <button
            className="brochureLightboxClose"
            type="button"
            onClick={closeLightbox}
            aria-label="Close"
          >
            Close
          </button>
          <button
            className="brochureLightboxArrow brochureLightboxArrowLeft"
            type="button"
            onClick={() => moveLightbox(-1)}
            aria-label="Previous"
          >
            Prev
          </button>
          <figure className="brochureLightboxFigure">
            <img
              src={lightbox.images[lightbox.index].url}
              alt={lightbox.images[lightbox.index].label}
            />
          </figure>
          <button
            className="brochureLightboxArrow brochureLightboxArrowRight"
            type="button"
            onClick={() => moveLightbox(1)}
            aria-label="Next"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
