"use client";

/* eslint-disable @next/next/no-img-element */

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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

export function MyExperienceGalleryCarousel({
  images,
}: MyExperienceGalleryCarouselProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ startX: number; startScrollLeft: number; dragging: boolean } | null>(null);
  const clusters = useMemo(() => chunkImages(images, IMAGES_PER_CLUSTER), [images]);
  const loopedClusters = useMemo(
    () => (clusters.length > 1 ? [...clusters, ...clusters, ...clusters] : clusters),
    [clusters],
  );
  const [activeCluster, setActiveCluster] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const clusterWidth = () => {
    const viewport = viewportRef.current;
    if (!viewport) return 0;
    const firstCluster = viewport.querySelector<HTMLElement>(".myExperienceGalleryCluster");
    return firstCluster?.offsetWidth ?? viewport.clientWidth;
  };

  const clusterStep = () => {
    const width = clusterWidth();
    return width ? width + 24 : 0;
  };

  const loopWidth = () => clusterStep() * clusters.length;

  const normalizeScrollPosition = () => {
    const viewport = viewportRef.current;
    const width = loopWidth();
    if (!viewport || clusters.length <= 1 || width <= 0) return;

    if (viewport.scrollLeft < width * 0.5) {
      viewport.scrollLeft += width;
    } else if (viewport.scrollLeft >= width * 2.5) {
      viewport.scrollLeft -= width;
    }
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || clusters.length <= 1) return;

    const positionAtMiddleLoop = () => {
      const width = loopWidth();
      if (width > 0) {
        viewport.scrollLeft = width;
      }
    };

    positionAtMiddleLoop();
    const resizeObserver = new ResizeObserver(positionAtMiddleLoop);
    resizeObserver.observe(viewport);

    return () => {
      resizeObserver.disconnect();
    };
    // clusters.length intentionally drives the loop geometry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusters.length]);

  const scrollToCluster = (index: number, behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const step = clusterStep();
    if (!step) return;
    const boundedIndex = ((index % clusters.length) + clusters.length) % clusters.length;
    const baseOffset = clusters.length > 1 ? loopWidth() : 0;

    viewport.scrollTo({
      left: baseOffset + boundedIndex * step,
      behavior,
    });
    setActiveCluster(boundedIndex);
  };

  const snapToNearestCluster = (behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport || clusters.length === 0) return;

    const step = clusterStep();
    if (!step) return;

    const baseOffset = clusters.length > 1 ? loopWidth() : 0;
    const relativeOffset = viewport.scrollLeft - baseOffset;
    const nearestIndex = Math.round(relativeOffset / step);
    scrollToCluster(nearestIndex, behavior);
  };

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    normalizeScrollPosition();

    const step = clusterStep();
    if (!step || clusters.length === 0) return;

    const nextIndex =
      ((Math.round(viewport.scrollLeft / step) % clusters.length) + clusters.length) %
      clusters.length;
    if (nextIndex !== activeCluster) {
      setActiveCluster(nextIndex);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

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
      event.preventDefault();
    }

    viewport.scrollLeft = dragState.startScrollLeft - deltaX;
    normalizeScrollPosition();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    const viewport = viewportRef.current;
    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setIsDragging(false);
    normalizeScrollPosition();

    if (dragState?.dragging) {
      snapToNearestCluster();
    }
  };

  return (
    <div
      className="myExperienceGalleryCarousel"
      data-dragging={isDragging ? "true" : "false"}
    >
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
          {loopedClusters.map((clusterImages, clusterIndex) => (
            <section className="myExperienceGalleryCluster" key={`cluster-${clusterIndex}`}>
              <div className="myExperienceGalleryClusterGrid">
                {clusterImages.map((image) => (
                  <figure
                    key={`${image.id}-${clusterIndex}`}
                    className="myExperienceGalleryCard myExperienceGalleryClusterCard"
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
        <div className="myExperienceGalleryCarouselControls" aria-hidden="true">
          <div className="myExperienceGalleryCarouselStatus">
            <span>{String(activeCluster + 1).padStart(2, "0")}</span>
            <span>/</span>
            <span>{String(clusters.length).padStart(2, "0")}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
