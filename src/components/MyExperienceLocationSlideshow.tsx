"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Slide = {
  src: string;
  alt: string;
};

type MyExperienceLocationSlideshowProps = {
  slides: Slide[];
};

export function MyExperienceLocationSlideshow({
  slides,
}: MyExperienceLocationSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 3600);

    return () => {
      window.clearInterval(interval);
    };
  }, [slides.length]);

  return (
    <div className="myExperienceMapSlideshow">
      <div className="myExperienceMapDots" aria-label="Diaporama cadre de vie">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            className="myExperienceMapDot"
            data-active={index === activeIndex ? "true" : "false"}
            aria-label={`Afficher l'image ${index + 1}`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>

      <div className="myExperienceMapSlides">
        {slides.map((slide, index) => (
          <div
            key={slide.src}
            className="myExperienceMapSlide"
            data-active={index === activeIndex ? "true" : "false"}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="myExperienceMapImage"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
