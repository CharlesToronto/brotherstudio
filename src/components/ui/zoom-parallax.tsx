"use client";

/* eslint-disable @next/next/no-img-element */

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

interface ZoomParallaxImage {
  src: string;
  alt?: string;
}

interface ZoomParallaxProps {
  images: ZoomParallaxImage[];
}

const tileClasses = [
  "zoomParallaxTileCenter",
  "zoomParallaxTileTopLeft",
  "zoomParallaxTileLeftTall",
  "zoomParallaxTileRightMid",
  "zoomParallaxTileBottomLeft",
  "zoomParallaxTileBottomWide",
  "zoomParallaxTileSmallRight",
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function ZoomParallax({ images }: ZoomParallaxProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const lastTouchY = useRef<number | null>(null);
  const progress = useMotionValue(0);
  const smoothProgress = useSpring(progress, {
    stiffness: 120,
    damping: 26,
    mass: 0.35,
  });

  const scale4 = useTransform(smoothProgress, [0, 1], [1, 4.4]);
  const scale5 = useTransform(smoothProgress, [0, 1], [1, 5.4]);
  const scale6 = useTransform(smoothProgress, [0, 1], [1, 6.4]);
  const scale8 = useTransform(smoothProgress, [0, 1], [1, 8.4]);
  const scale9 = useTransform(smoothProgress, [0, 1], [1, 9.4]);
  const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9];

  const limitedImages = images.slice(0, 7);

  useEffect(() => {
    const getIsInteractive = () => {
      if (!container.current) return false;

      const rect = container.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const activationTop = viewportHeight * 0.28;
      const activationBottom = viewportHeight * 0.72;

      return rect.top <= activationTop && rect.bottom >= activationBottom;
    };

    const driveProgress = (delta: number) => {
      if (!getIsInteractive()) return false;

      const current = progress.get();
      const canMoveForward = delta > 0 && current < 1;
      const canMoveBackward = delta < 0 && current > 0;

      if (!canMoveForward && !canMoveBackward) return false;

      progress.set(clamp(current + delta / 800, 0, 1));
      return true;
    };

    const handleWheel = (event: WheelEvent) => {
      if (!driveProgress(event.deltaY)) return;
      event.preventDefault();
    };

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const currentTouchY = event.touches[0]?.clientY;
      if (currentTouchY == null || lastTouchY.current == null) return;

      const delta = lastTouchY.current - currentTouchY;
      lastTouchY.current = currentTouchY;

      if (!driveProgress(delta * 2.8)) return;
      event.preventDefault();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [progress]);

  return (
    <div ref={container} className="zoomParallax">
      <div className="zoomParallaxSticky">
        {limitedImages.map(({ src, alt }, index) => (
          <motion.div
            key={`${src}-${index}`}
            style={{ scale: scales[index % scales.length] }}
            className="zoomParallaxLayer"
          >
            <div className={`zoomParallaxTile ${tileClasses[index % tileClasses.length]}`}>
              <img
                src={src || "/placeholder.svg"}
                alt={alt || `Parallax image ${index + 1}`}
                className="zoomParallaxImage"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
