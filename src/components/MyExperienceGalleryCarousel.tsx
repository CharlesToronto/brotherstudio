"use client";

/* eslint-disable @next/next/no-img-element */

import type { PointerEvent as ReactPointerEvent } from "react";
import { useMemo, useRef, useState } from "react";

type GalleryCarouselImage = {
  id: string;
  src: string;
  alt: string;
};

type MyExperienceGalleryCarouselProps = {
  images: GalleryCarouselImage[];
};

const IMAGES_PER_CLUSTER = 5;

function chunkImages(images: GalleryCarouselImage[], size: number) {
  const chunks: GalleryCarouselImage[][] = [];

  for (let index = 0; index < images.length; index += size) {
    chunks.push(images.slice(index, index + size));
  }

  return chunks;
}

function GalleryArrow({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        d={direction === "previous" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"}
      />
    </svg>
  );
}

export function MyExperienceGalleryCarousel({
  images,
}: MyExperienceGalleryCarouselProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ startX: number; startScrollLeft: number; dragging: boolean } | null>(null);
  const clusters = useMemo(() => chunkImages(images, IMAGES_PER_CLUSTER), [images]);
  const [activeCluster, setActiveCluster] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const clusterWidth = () => {
    const viewport = viewportRef.current;
    if (!viewport) return 0;
    const firstCluster = viewport.querySelector<HTMLElement>(".myExperienceGalleryCluster");
    return firstCluster?.offsetWidth ?? viewport.clientWidth;
  };

  const scrollToCluster = (index: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const boundedIndex = Math.max(0, Math.min(index, clusters.length - 1));
    const width = clusterWidth();

    viewport.scrollTo({
      left: boundedIndex * (width + 24),
      behavior: "smooth",
    });
    setActiveCluster(boundedIndex);
  };

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const width = clusterWidth();
    if (!width) return;

    const nextIndex = Math.round(viewport.scrollLeft / (width + 24));
    if (nextIndex !== activeCluster) {
      setActiveCluster(nextIndex);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    dragStateRef.current = {
      startX: event.clientX,
      startScrollLeft: viewport.scrollLeft,
      dragging: false,
    };
    setIsDragging(true);
    viewport.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const dragState = dragStateRef.current;
    if (!viewport || !dragState) return;

    const deltaX = event.clientX - dragState.startX;
    if (Math.abs(deltaX) > 6) {
      dragState.dragging = true;
    }

    viewport.scrollLeft = dragState.startScrollLeft - deltaX;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setIsDragging(false);
  };

  return (
    <div className="myExperienceGalleryCarousel" data-dragging={isDragging ? "true" : "false"}>
      <div
        className="myExperienceGalleryCarouselViewport"
        ref={viewportRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="myExperienceGalleryCarouselTrack">
          {clusters.map((clusterImages, clusterIndex) => (
            <section className="myExperienceGalleryCluster" key={`cluster-${clusterIndex}`}>
              <div className="myExperienceGalleryClusterGrid">
                {clusterImages.map((image, imageIndex) => (
                  <figure
                    key={image.id}
                    className={`myExperienceGalleryCard myExperienceGalleryClusterCard myExperienceGalleryClusterCard${imageIndex + 1}`}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="myExperienceGalleryImage"
                      loading={clusterIndex === 0 ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                    />
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {clusters.length > 1 ? (
        <div className="myExperienceGalleryCarouselControls">
          <div className="myExperienceGalleryCarouselStatus">
            <span>{String(activeCluster + 1).padStart(2, "0")}</span>
            <span>/</span>
            <span>{String(clusters.length).padStart(2, "0")}</span>
          </div>
          <div className="myExperienceGalleryCarouselButtons">
            <button
              type="button"
              className="myExperienceGalleryCarouselButton"
              onClick={() => scrollToCluster(activeCluster - 1)}
              disabled={activeCluster === 0}
              aria-label="Previous gallery set"
            >
              <GalleryArrow direction="previous" />
            </button>
            <button
              type="button"
              className="myExperienceGalleryCarouselButton"
              onClick={() => scrollToCluster(activeCluster + 1)}
              disabled={activeCluster >= clusters.length - 1}
              aria-label="Next gallery set"
            >
              <GalleryArrow direction="next" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
