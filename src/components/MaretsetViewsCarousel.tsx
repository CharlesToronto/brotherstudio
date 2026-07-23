"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type MaretsetGalleryImage = {
  src: string;
  alt: string;
};

type MaretsetViewsCarouselProps = {
  rows: MaretsetGalleryImage[][];
  images: MaretsetGalleryImage[];
  ariaLabel: string;
};

type DragState = {
  rowIndex: number;
  pointerId: number;
  startX: number;
  scrollLeft: number;
  hasMoved: boolean;
};

const MOBILE_GALLERY_PREVIEW_COUNT = 10;

function GalleryPlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
        d="M12 5v14M5 12h14"
      />
    </svg>
  );
}

function GalleryMinusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
        d="M5 12h14"
      />
    </svg>
  );
}

export function MaretsetViewsCarousel({ rows, images, ariaLabel }: MaretsetViewsCarouselProps) {
  const dragState = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const [draggingRow, setDraggingRow] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isMobileGalleryExpanded, setIsMobileGalleryExpanded] = useState(false);

  const activeImage = activeIndex === null ? null : images[activeIndex];
  const activeSlideNumber = activeIndex === null ? 0 : activeIndex + 1;
  const shouldClampMobileGallery = !isMobileGalleryExpanded && images.length > MOBILE_GALLERY_PREVIEW_COUNT;
  const mobileRenderedImages = shouldClampMobileGallery
    ? images.slice(0, MOBILE_GALLERY_PREVIEW_COUNT)
    : images;

  const openImage = (image: MaretsetGalleryImage) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }

    const nextIndex = images.findIndex((item) => item.src === image.src);
    setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
  };

  const showPreviousImage = () => {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) return currentIndex;
      return currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    });
  };

  const showNextImage = () => {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) return currentIndex;
      return currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    });
  };

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") {
        setActiveIndex((currentIndex) => {
          if (currentIndex === null) return currentIndex;
          return currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        });
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((currentIndex) => {
          if (currentIndex === null) return currentIndex;
          return currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        });
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length]);

  return (
    <>
      <div
        className="maretsetWebsiteGalleryGrid"
        aria-label={ariaLabel}
        data-dragging={draggingRow === null ? undefined : "true"}
      >
        {rows.map((rowImages, rowIndex) => (
          <div
            className="maretsetWebsiteGalleryRow"
            key={`maretset-gallery-row-${rowIndex}`}
            data-dragging={draggingRow === rowIndex ? "true" : undefined}
            onPointerDown={(event) => {
              const row = event.currentTarget;
              dragState.current = {
                rowIndex,
                pointerId: event.pointerId,
                startX: event.clientX,
                scrollLeft: row.scrollLeft,
                hasMoved: false,
              };
              row.setPointerCapture(event.pointerId);
              setDraggingRow(rowIndex);
            }}
            onPointerMove={(event) => {
              const drag = dragState.current;

              if (!drag || drag.rowIndex !== rowIndex || drag.pointerId !== event.pointerId) return;

              const dragDistance = event.clientX - drag.startX;
              if (Math.abs(dragDistance) > 6) {
                drag.hasMoved = true;
                suppressClick.current = true;
              }

              event.preventDefault();
              event.currentTarget.scrollLeft = drag.scrollLeft - dragDistance;
            }}
            onPointerUp={(event) => {
              if (dragState.current?.pointerId === event.pointerId) {
                suppressClick.current = dragState.current.hasMoved;
                dragState.current = null;
                setDraggingRow(null);
              }
            }}
            onPointerCancel={() => {
              dragState.current = null;
              setDraggingRow(null);
            }}
          >
            <div className="maretsetWebsiteGalleryTrack">
              {[0, 1].map((copyIndex) => (
                <div
                  className="maretsetWebsiteGallerySet"
                  key={`maretset-gallery-row-${rowIndex}-set-${copyIndex}`}
                  aria-hidden={copyIndex === 1 ? true : undefined}
                >
                  {rowImages.map((image) => (
                    <button
                      className="maretsetWebsiteGalleryButton"
                      key={`${image.src}-${rowIndex}-${copyIndex}`}
                      type="button"
                      tabIndex={copyIndex === 0 ? 0 : -1}
                      onClick={() => openImage(image)}
                      aria-label={copyIndex === 0 ? `Open ${image.alt}` : undefined}
                    >
                      <Image
                        src={image.src}
                        alt={copyIndex === 0 ? image.alt : ""}
                        width={1200}
                        height={800}
                        draggable={false}
                        sizes="(max-width: 900px) 72vw, 29vw"
                      />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="galleryRevealShell maretsetWebsiteMobileGalleryRevealShell"
        data-expanded={isMobileGalleryExpanded ? "true" : "false"}
        data-clamped={shouldClampMobileGallery ? "true" : "false"}
      >
        <div className="maretsetWebsiteMobileGalleryGrid" role="list" aria-label={ariaLabel}>
          {mobileRenderedImages.map((image, index) => (
            <button
              className="maretsetWebsiteMobileGalleryCard"
              key={`maretset-mobile-gallery-${image.src}`}
              type="button"
              role="listitem"
              onClick={() => openImage(image)}
              aria-label={`Open ${image.alt || `image ${index + 1}`}`}
            >
              <Image
                className="maretsetWebsiteMobileGalleryImage"
                src={image.src}
                alt={image.alt || `Maretset image ${index + 1}`}
                width={1600}
                height={1600}
                sizes="(max-width: 640px) calc((100vw - 54px) / 2), 240px"
                quality={78}
              />
            </button>
          ))}
        </div>

        {shouldClampMobileGallery ? (
          <button
            type="button"
            className="galleryRevealButton"
            aria-label="Show all Maretset gallery images"
            onClick={() => setIsMobileGalleryExpanded(true)}
          >
            <GalleryPlusIcon />
          </button>
        ) : null}
      </div>

      {isMobileGalleryExpanded && images.length > MOBILE_GALLERY_PREVIEW_COUNT ? (
        <div className="galleryCollapseControl maretsetWebsiteMobileGalleryCollapseControl">
          <button
            type="button"
            className="galleryCollapseButton"
            aria-label="Reduce Maretset gallery"
            onClick={() => setIsMobileGalleryExpanded(false)}
          >
            <GalleryMinusIcon />
          </button>
        </div>
      ) : null}

      {activeImage ? (
        <div
          className="maretsetWebsiteGalleryLightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Maretset image slideshow"
          onClick={() => setActiveIndex(null)}
        >
          <button
            className="maretsetWebsiteGalleryLightboxClose"
            type="button"
            onClick={() => setActiveIndex(null)}
            aria-label="Close slideshow"
          >
            ×
          </button>
          <button
            className="maretsetWebsiteGalleryLightboxNav maretsetWebsiteGalleryLightboxPrev"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showPreviousImage();
            }}
            aria-label="Previous image"
          >
            ‹
          </button>
          <figure className="maretsetWebsiteGalleryLightboxFigure" onClick={(event) => event.stopPropagation()}>
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              width={1800}
              height={1200}
              sizes="100vw"
              priority
            />
            <figcaption>
              <span>
                {String(activeSlideNumber).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
              </span>
              <strong>{activeImage.alt}</strong>
            </figcaption>
          </figure>
          <button
            className="maretsetWebsiteGalleryLightboxNav maretsetWebsiteGalleryLightboxNext"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNextImage();
            }}
            aria-label="Next image"
          >
            ›
          </button>
        </div>
      ) : null}
    </>
  );
}
