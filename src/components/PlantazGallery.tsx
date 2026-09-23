"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type PlantazGalleryImage = { id: string; url: string };

export function PlantazGallery({ images }: { images: PlantazGalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const close = () => setActiveIndex(null);
  const previous = () => setActiveIndex((current) => current === null ? null : (current - 1 + images.length) % images.length);
  const next = () => setActiveIndex((current) => current === null ? null : (current + 1) % images.length);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex]);

  return (
    <>
      <div className="plantazGallery">
        {images.map((image, index) => (
          <figure key={image.id}>
            <button type="button" className="plantazGalleryOpen" onClick={() => setActiveIndex(index)} aria-label={`Ouvrir l’image Plantaz ${index + 1}`}>
              <img src={image.url} alt={`Plantaz — vue ${index + 1}`} loading={index > 2 ? "lazy" : "eager"} />
            </button>
            <figcaption>Plantaz · {String(index + 1).padStart(2, "0")}</figcaption>
          </figure>
        ))}
      </div>

      {mounted && activeIndex !== null ? createPortal(
        <div className="plantazGalleryLightbox" role="dialog" aria-modal="true" aria-label={`Image Plantaz ${activeIndex + 1} sur ${images.length}`} onClick={close}>
          <button type="button" className="plantazGalleryClose" onClick={close} aria-label="Fermer l’image">×</button>
          <img src={images[activeIndex].url} alt={`Plantaz — vue ${activeIndex + 1}`} onClick={(event) => event.stopPropagation()} />
          <div className="plantazGalleryControls" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={previous} aria-label="Image précédente">←</button>
            <span>{String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
            <button type="button" onClick={next} aria-label="Image suivante">→</button>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
