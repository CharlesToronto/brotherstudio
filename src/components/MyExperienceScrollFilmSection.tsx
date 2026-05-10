"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

type MyExperienceScrollFilmSectionProps = {
  images: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function MyExperienceScrollFilmSection({
  images,
}: MyExperienceScrollFilmSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const wheelBufferRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const lockUntilRef = useRef(0);
  const activeFrameRef = useRef(0);
  const [activeFrame, setActiveFrame] = useState(0);

  useEffect(() => {
    activeFrameRef.current = activeFrame;
  }, [activeFrame]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isSectionPinned = () => {
      const rect = section.getBoundingClientRect();
      return rect.top <= 24 && rect.bottom >= window.innerHeight - 24;
    };

    const canReleaseScroll = (deltaY: number) => {
      const frameIndex = activeFrameRef.current;
      const isAtFirstFrame = frameIndex === 0 && deltaY < 0;
      const isAtLastFrame = frameIndex === images.length - 1 && deltaY > 0;
      return isAtFirstFrame || isAtLastFrame;
    };

    const stepFrame = (direction: 1 | -1) => {
      const now = Date.now();
      if (now < lockUntilRef.current) return;

      lockUntilRef.current = now + 260;
      setActiveFrame((current) => clamp(current + direction, 0, images.length - 1));
    };

    const onWheel = (event: WheelEvent) => {
      if (!isSectionPinned()) return;
      if (canReleaseScroll(event.deltaY)) return;

      event.preventDefault();

      if (Math.sign(wheelBufferRef.current) !== Math.sign(event.deltaY)) {
        wheelBufferRef.current = event.deltaY;
      } else {
        wheelBufferRef.current += event.deltaY;
      }

      if (Math.abs(wheelBufferRef.current) < 56) return;

      stepFrame(wheelBufferRef.current > 0 ? 1 : -1);
      wheelBufferRef.current = 0;
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isSectionPinned()) return;

      const currentY = event.touches[0]?.clientY;
      const startY = touchStartYRef.current;
      if (currentY === undefined || startY === null) return;

      const deltaY = startY - currentY;
      if (Math.abs(deltaY) < 18) return;
      if (canReleaseScroll(deltaY)) return;

      event.preventDefault();
      stepFrame(deltaY > 0 ? 1 : -1);
      touchStartYRef.current = currentY;
    };

    const onTouchEnd = () => {
      touchStartYRef.current = null;
    };

    section.addEventListener("wheel", onWheel, { passive: false });
    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchmove", onTouchMove, { passive: false });
    section.addEventListener("touchend", onTouchEnd, { passive: true });
    section.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      section.removeEventListener("wheel", onWheel);
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchmove", onTouchMove);
      section.removeEventListener("touchend", onTouchEnd);
      section.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [images.length]);

  return (
    <section ref={sectionRef} className="myExperienceFilmSection">
      <div className="myExperienceFilmStage">
        {images.map((image, index) => (
          <figure
            key={`${image}-${index}`}
            className="myExperienceFilmFrame"
            style={{ opacity: index <= activeFrame ? 1 : 0 }}
          >
            <img
              src={image}
              alt={`Mesange cinematic frame ${index + 1}`}
              className="myExperienceFilmImage"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </figure>
        ))}

        <div className="myExperienceFilmHud" aria-hidden="true">
          <span>{String(activeFrame + 1).padStart(2, "0")}</span>
          <span>/</span>
          <span>{String(images.length).padStart(2, "0")}</span>
        </div>
      </div>
    </section>
  );
}
