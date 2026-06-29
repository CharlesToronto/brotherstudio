"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Gallery } from "@/components/Gallery";
import {
  HomeMobileDisplayFilters,
  HomeSceneFilters,
} from "@/components/HomeGalleryControls";
import {
  PROJECT_OPTIONS,
  type GalleryProjectKey,
} from "@/lib/galleryProjects";
import type { GalleryItem } from "@/lib/galleryStore";

type HomeGalleryExperienceProps = {
  items: GalleryItem[];
  filterLabels: {
    all: string;
    ariaLabel: string;
  };
  sceneFilterLabels: {
    ariaLabel: string;
    video: string;
    all: string;
    bedroom: string;
    livingRoom: string;
    kitchen: string;
    exterior: string;
    bathroom: string;
    focusAmbiance: string;
  };
};

const ALWAYS_VISIBLE_MARQUEE_PROJECT_KEYS = new Set<GalleryProjectKey>(["hdm6"]);
const MOBILE_HIDDEN_PROJECT_KEYS = new Set<GalleryProjectKey>(["jolimont", "markham"]);
const MOBILE_PRIORITY_PROJECT_KEYS: GalleryProjectKey[] = ["tourelle", "maretset"];
const MOBILE_GALLERY_MEDIA_QUERY = "(max-width: 640px)";
type MobileDisplayMode = "projects" | "grid";
type SceneFilterKey =
  | "video"
  | "all"
  | "bedroom"
  | "living-room"
  | "kitchen"
  | "exterior"
  | "bathroom"
  | "focus-ambiance";

function normalizeSceneValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSceneFilterForItem(item: GalleryItem): Exclude<SceneFilterKey, "all" | "video"> | null {
  const value = normalizeSceneValue(item.architect);

  if (
    value.includes("bed room") ||
    value.includes("bedroom") ||
    value.includes("chambre")
  ) {
    return "bedroom";
  }

  if (value.includes("living room") || value.includes("salon")) {
    return "living-room";
  }

  if (value.includes("kitchen") || value.includes("cuisine")) {
    return "kitchen";
  }

  if (
    value.includes("exterior") ||
    value.includes("exterieure") ||
    value.includes("exterieur") ||
    value.includes("drone view") ||
    value.includes("veranda")
  ) {
    return "exterior";
  }

  if (value.includes("bathroom") || value.includes("salle de bain")) {
    return "bathroom";
  }

  if (
    value.includes("focus") ||
    value.includes("ambiance") ||
    value.includes("style")
  ) {
    return "focus-ambiance";
  }

  return null;
}

function LightboxArrow({
  direction,
}: {
  direction: "left" | "right";
}) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
      />
    </svg>
  );
}

function LightboxCloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}

export function HomeGalleryExperience({
  items,
  filterLabels,
  sceneFilterLabels,
}: HomeGalleryExperienceProps) {
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [mobileDisplayMode, setMobileDisplayMode] = useState<MobileDisplayMode>("grid");
  const [activeProject, setActiveProject] = useState<GalleryProjectKey | "all">("all");
  const [activeSceneFilter, setActiveSceneFilter] = useState<SceneFilterKey>("all");
  const [activeMobileItem, setActiveMobileItem] = useState<GalleryItem | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);
  const singleLoopWidthRef = useRef(0);
  const lightboxPreviewRefs = useRef(new Map<string, HTMLButtonElement>());
  const sceneFilters = [
    { key: "video", label: sceneFilterLabels.video },
    { key: "all", label: sceneFilterLabels.all },
    { key: "bedroom", label: sceneFilterLabels.bedroom },
    { key: "living-room", label: sceneFilterLabels.livingRoom },
    { key: "kitchen", label: sceneFilterLabels.kitchen },
    { key: "exterior", label: sceneFilterLabels.exterior },
    { key: "bathroom", label: sceneFilterLabels.bathroom },
    { key: "focus-ambiance", label: sceneFilterLabels.focusAmbiance },
  ] as const;
  const availableProjects = PROJECT_OPTIONS.filter((option) =>
    ALWAYS_VISIBLE_MARQUEE_PROJECT_KEYS.has(option.key) ||
    items.some((item) => item.project === option.key),
  );
  const marqueeProjects = [...availableProjects, ...availableProjects];
  const effectiveActiveProject = isMobileLayout ? "all" : activeProject;
  const projectFilteredItems =
    effectiveActiveProject === "all"
      ? items
      : items.filter((item) => item.project === effectiveActiveProject);
  const availableSceneFilters = sceneFilters.filter(
    (filter) =>
      filter.key === "all" ||
      filter.key === "video" ||
      projectFilteredItems.some((item) => getSceneFilterForItem(item) === filter.key),
  );
  const resolvedSceneFilter = availableSceneFilters.some(
    (filter) => filter.key === activeSceneFilter,
  )
    ? activeSceneFilter
    : "all";
  const effectiveSceneFilter =
    isMobileLayout && mobileDisplayMode === "projects" ? "all" : resolvedSceneFilter;
  const isVideoFilterActive = effectiveSceneFilter === "video";
  const visibleItems =
    effectiveSceneFilter === "all"
      ? projectFilteredItems
      : effectiveSceneFilter === "video"
        ? []
      : projectFilteredItems.filter((item) => getSceneFilterForItem(item) === effectiveSceneFilter);
  const orderedMobileProjects = [
    ...MOBILE_PRIORITY_PROJECT_KEYS
      .map((key) => availableProjects.find((project) => project.key === key))
      .filter((project): project is (typeof availableProjects)[number] => Boolean(project)),
    ...availableProjects.filter((project) => !MOBILE_PRIORITY_PROJECT_KEYS.includes(project.key)),
  ];
  const mobileProjectGroups = orderedMobileProjects
    .filter((project) => !MOBILE_HIDDEN_PROJECT_KEYS.has(project.key))
    .map((project) => ({
      key: project.key,
      label: project.label,
      items: visibleItems.filter((item) => item.project === project.key),
    }))
    .filter((group) => group.items.length > 0);
  const mobileVisibleItems = [
    ...mobileProjectGroups.flatMap((group) => group.items),
    ...visibleItems.filter((item) => item.project === null),
  ];
  const mobileLightboxItems =
    mobileDisplayMode === "projects"
      ? mobileProjectGroups.flatMap((group) => group.items)
      : mobileVisibleItems;
  const activeMobileItemIndex = activeMobileItem
    ? mobileLightboxItems.findIndex((item) => item.id === activeMobileItem.id)
    : -1;
  const hasMobileLightboxNavigation =
    mobileLightboxItems.length > 1 && activeMobileItemIndex !== -1;

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_GALLERY_MEDIA_QUERY);
    const syncMobileLayout = () => {
      setIsMobileLayout(mediaQuery.matches);
    };

    syncMobileLayout();
    mediaQuery.addEventListener("change", syncMobileLayout);

    return () => {
      mediaQuery.removeEventListener("change", syncMobileLayout);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || availableProjects.length === 0) return;

    const updateMetrics = () => {
      const singleLoopWidth = track.scrollWidth / 2;
      singleLoopWidthRef.current = singleLoopWidth;
      if (!singleLoopWidth) return;
      if (offsetRef.current === 0) {
        offsetRef.current = -singleLoopWidth;
      } else if (offsetRef.current <= -singleLoopWidth || offsetRef.current > 0) {
        offsetRef.current = ((offsetRef.current % singleLoopWidth) + singleLoopWidth) % singleLoopWidth;
        offsetRef.current -= singleLoopWidth;
      }
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    };

    updateMetrics();

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics();
    });

    resizeObserver.observe(track);

    return () => {
      resizeObserver.disconnect();
    };
  }, [availableProjects.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || availableProjects.length === 0) return;

    const step = (time: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = time;
      }

      const delta = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;

      if (activeProject === "all" && !isHovered && !isDragging) {
        const singleLoopWidth = singleLoopWidthRef.current;
        if (singleLoopWidth > 0) {
          let nextOffset = offsetRef.current + delta * 0.035;
          if (nextOffset >= 0) {
            nextOffset -= singleLoopWidth;
          }
          offsetRef.current = nextOffset;
          track.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
        }
      }

      frameRef.current = window.requestAnimationFrame(step);
    };

    frameRef.current = window.requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
      lastFrameTimeRef.current = null;
    };
  }, [activeProject, availableProjects.length, isDragging, isHovered]);

  const toggleProject = (project: GalleryProjectKey) => {
    setActiveProject((current) => (current === project ? "all" : project));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button")) return;
    pointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    didDragRef.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || pointerIdRef.current !== event.pointerId) return;
    const singleLoopWidth = singleLoopWidthRef.current;
    if (!singleLoopWidth) return;

    const deltaX = event.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 4) {
      didDragRef.current = true;
    }

    let nextOffset = dragStartOffsetRef.current + deltaX;
    while (nextOffset > 0) {
      nextOffset -= singleLoopWidth;
    }
    while (nextOffset <= -singleLoopWidth) {
      nextOffset += singleLoopWidth;
    }

    offsetRef.current = nextOffset;
    const track = trackRef.current;
    if (track) {
      track.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
    }
  };

  const finishDragging = () => {
    if (
      pointerIdRef.current !== null &&
      viewportRef.current?.hasPointerCapture(pointerIdRef.current)
    ) {
      viewportRef.current.releasePointerCapture(pointerIdRef.current);
    }
    if (didDragRef.current) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    setIsDragging(false);
    pointerIdRef.current = null;
  };

  useEffect(() => {
    if (!activeMobileItem) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveMobileItem(null);
      if (event.key === "ArrowLeft" && hasMobileLightboxNavigation) {
        const previousIndex =
          (activeMobileItemIndex - 1 + mobileLightboxItems.length) % mobileLightboxItems.length;
        setActiveMobileItem(mobileLightboxItems[previousIndex] ?? null);
      }
      if (event.key === "ArrowRight" && hasMobileLightboxNavigation) {
        const nextIndex = (activeMobileItemIndex + 1) % mobileLightboxItems.length;
        setActiveMobileItem(mobileLightboxItems[nextIndex] ?? null);
      }
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeMobileItem,
    activeMobileItemIndex,
    hasMobileLightboxNavigation,
    mobileLightboxItems,
  ]);

  useEffect(() => {
    if (!activeMobileItem) return;
    const previewNode = lightboxPreviewRefs.current.get(activeMobileItem.id);
    previewNode?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeMobileItem]);

  return (
    <section id="home-gallery-start">
      {!isMobileLayout && marqueeProjects.length > 0 ? (
        <section
          className="homeProjectMarquee"
          aria-label="Selected projects"
          data-paused={activeProject !== "all" || isHovered || isDragging ? "true" : "false"}
          data-dragging={isDragging ? "true" : "false"}
        >
          <div
            ref={viewportRef}
            className="homeProjectMarqueeViewport"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDragging}
            onPointerCancel={finishDragging}
          >
            <div ref={trackRef} className="homeProjectMarqueeTrack">
              {marqueeProjects.map((project, index) => (
                <button
                  key={`${project.key}-${index}`}
                  className="homeProjectMarqueeItem"
                  type="button"
                  data-active={activeProject === project.key ? "true" : "false"}
                  aria-pressed={activeProject === project.key}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (suppressClickRef.current) {
                      event.preventDefault();
                      return;
                    }
                    toggleProject(project.key);
                  }}
                >
                  {project.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!isMobileLayout && availableSceneFilters.length > 1 ? (
        <HomeSceneFilters
          activeFilter={effectiveSceneFilter}
          ariaLabel={sceneFilterLabels.ariaLabel}
          filters={availableSceneFilters}
          onFilterChange={setActiveSceneFilter}
        />
      ) : null}

      <div id="home-gallery-grid">
        {isVideoFilterActive ? (
          <div className="homeVideoGallery" role="list" aria-label={sceneFilterLabels.video}>
            <article className="homeVideoGalleryCard" role="listitem">
              <video src="/videos/bs-maretset-2.mp4" muted loop playsInline controls />
            </article>
          </div>
        ) : isMobileLayout ? (
          <>
            <HomeMobileDisplayFilters
              activeMode={mobileDisplayMode}
              onModeChange={setMobileDisplayMode}
            />

            {availableSceneFilters.length > 1 && mobileDisplayMode === "grid" ? (
              <HomeSceneFilters
                activeFilter={effectiveSceneFilter}
                ariaLabel={sceneFilterLabels.ariaLabel}
                filters={availableSceneFilters}
                onFilterChange={setActiveSceneFilter}
              />
            ) : null}

            {mobileDisplayMode === "projects" ? (
              <div className="homeProjectCarousels" role="list" aria-label={filterLabels.ariaLabel}>
                {mobileProjectGroups.map((group) => (
                  <section
                    key={group.key}
                    className="homeProjectCarouselSection"
                    role="listitem"
                    aria-label={group.label}
                  >
                    <div className="homeProjectCarouselHeader">
                      <h2 className="homeProjectCarouselTitle">{group.label}</h2>
                      <div className="homeProjectCarouselCount">{group.items.length}</div>
                    </div>
                    <div className="homeProjectCarouselTrack" role="list" aria-label={group.label}>
                      {group.items.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          className="homeProjectCarouselCard"
                          role="listitem"
                          onClick={() => setActiveMobileItem(item)}
                          aria-label={`${group.label} image ${index + 1}`}
                        >
                          <div className="homeProjectCarouselImageFrame">
                            <Image
                              className="homeProjectCarouselImage"
                              src={item.src}
                              alt={item.architect || `${group.label} image ${index + 1}`}
                              width={1600}
                              height={1600}
                              sizes="(max-width: 640px) calc(100vw - 54px), 320px"
                              quality={78}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="homeMobileGalleryGrid" role="list" aria-label={filterLabels.ariaLabel}>
                {mobileVisibleItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className="homeMobileGalleryGridCard"
                    role="listitem"
                    onClick={() => setActiveMobileItem(item)}
                    aria-label={`Image ${index + 1}`}
                  >
                    <Image
                      className="homeMobileGalleryGridImage"
                      src={item.src}
                      alt={item.architect || `Image ${index + 1}`}
                      width={1600}
                      height={1600}
                      sizes="(max-width: 640px) calc((100vw - 54px) / 2), 240px"
                      quality={78}
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <Gallery
            key={activeProject}
            items={visibleItems}
            showProjectFilters={false}
            filterLabels={filterLabels}
            galleryState={{
              activeProject,
              visibleCount: visibleItems.length,
            }}
          />
        )}
      </div>

      {activeMobileItem ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveMobileItem(null)}
        >
          <button
            type="button"
            className="lightboxClose"
            aria-label="Close slideshow"
            onClick={(event) => {
              event.stopPropagation();
              setActiveMobileItem(null);
            }}
          >
            <LightboxCloseIcon />
          </button>
          {hasMobileLightboxNavigation ? (
            <button
              type="button"
              className="lightboxArrow lightboxArrowLeft"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                const previousIndex =
                  (activeMobileItemIndex - 1 + mobileLightboxItems.length) %
                  mobileLightboxItems.length;
                setActiveMobileItem(mobileLightboxItems[previousIndex] ?? null);
              }}
            >
              <LightboxArrow direction="left" />
            </button>
          ) : null}
          <Image
            className="lightboxImage"
            src={activeMobileItem.src}
            alt={activeMobileItem.architect}
            width={2000}
            height={2000}
            sizes="100vw"
          />
          {hasMobileLightboxNavigation ? (
            <div
              className="lightboxPreviewRail"
              role="list"
              aria-label="Image previews"
              onClick={(event) => event.stopPropagation()}
            >
              {mobileLightboxItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className="lightboxPreviewButton"
                  data-active={item.id === activeMobileItem.id ? "true" : "false"}
                  role="listitem"
                  aria-label={`Open preview ${index + 1}`}
                  onClick={() => setActiveMobileItem(item)}
                  ref={(node) => {
                    if (node) {
                      lightboxPreviewRefs.current.set(item.id, node);
                    } else {
                      lightboxPreviewRefs.current.delete(item.id);
                    }
                  }}
                >
                  <Image
                    className="lightboxPreviewImage"
                    src={item.src}
                    alt={item.architect || `Preview ${index + 1}`}
                    width={240}
                    height={240}
                    sizes="72px"
                  />
                </button>
              ))}
            </div>
          ) : null}
          {hasMobileLightboxNavigation ? (
            <button
              type="button"
              className="lightboxArrow lightboxArrowRight"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                const nextIndex = (activeMobileItemIndex + 1) % mobileLightboxItems.length;
                setActiveMobileItem(mobileLightboxItems[nextIndex] ?? null);
              }}
            >
              <LightboxArrow direction="right" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div id="home-gallery-end" aria-hidden="true" />
    </section>
  );
}
