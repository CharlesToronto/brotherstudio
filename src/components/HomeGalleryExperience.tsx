"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Gallery } from "@/components/Gallery";
import { PROJECT_OPTIONS, type GalleryProjectKey } from "@/lib/galleryProjects";
import type { GalleryItem } from "@/lib/galleryStore";

type HomeGalleryExperienceProps = {
  items: GalleryItem[];
  filterLabels: {
    all: string;
    ariaLabel: string;
  };
  sceneFilterLabels: {
    ariaLabel: string;
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
type SceneFilterKey =
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

function getSceneFilterForItem(item: GalleryItem): Exclude<SceneFilterKey, "all"> | null {
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

export function HomeGalleryExperience({
  items,
  filterLabels,
  sceneFilterLabels,
}: HomeGalleryExperienceProps) {
  const [activeProject, setActiveProject] = useState<GalleryProjectKey | "all">("all");
  const [activeSceneFilter, setActiveSceneFilter] = useState<SceneFilterKey>("all");
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
  const sceneFilters = [
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
  const projectFilteredItems =
    activeProject === "all"
      ? items
      : items.filter((item) => item.project === activeProject);
  const availableSceneFilters = sceneFilters.filter(
    (filter) =>
      filter.key === "all" ||
      projectFilteredItems.some((item) => getSceneFilterForItem(item) === filter.key),
  );
  const resolvedSceneFilter = availableSceneFilters.some(
    (filter) => filter.key === activeSceneFilter,
  )
    ? activeSceneFilter
    : "all";
  const visibleItems =
    resolvedSceneFilter === "all"
      ? projectFilteredItems
      : projectFilteredItems.filter((item) => getSceneFilterForItem(item) === resolvedSceneFilter);

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

  return (
    <section id="home-gallery-start">
      {marqueeProjects.length > 0 ? (
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

      {availableSceneFilters.length > 1 ? (
        <section className="homeSceneFilters" aria-label={sceneFilterLabels.ariaLabel}>
          {availableSceneFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className="homeSceneFilterButton"
              data-active={resolvedSceneFilter === filter.key}
              onClick={() => setActiveSceneFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </section>
      ) : null}

      <div id="home-gallery-grid">
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
      </div>

      <div id="home-gallery-end" aria-hidden="true" />
    </section>
  );
}
