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
  introLine: string;
};

export function HomeGalleryExperience({ items, filterLabels, introLine }: HomeGalleryExperienceProps) {
  const [activeProject, setActiveProject] = useState<GalleryProjectKey | "all">("all");
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
  const availableProjects = PROJECT_OPTIONS.filter((option) =>
    items.some((item) => item.project === option.key),
  );
  const marqueeProjects = [...availableProjects, ...availableProjects];
  const visibleItems =
    activeProject === "all"
      ? items
      : items.filter((item) => item.project === activeProject);

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
    <>
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
                  aria-hidden={index >= availableProjects.length ? "true" : undefined}
                  tabIndex={index >= availableProjects.length ? -1 : 0}
                  onClick={(event) => {
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

      <p className="homeIntro homeIntroHighlight">{introLine}</p>

      <Gallery
        key={activeProject}
        items={visibleItems}
        showProjectFilters={false}
        filterLabels={filterLabels}
      />
    </>
  );
}
