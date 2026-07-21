"use client";

import { useEffect, useRef } from "react";

const MIN_SCROLL_DELTA = 1;

export function useHeroScrollBridge<T extends HTMLElement>() {
  const heroRef = useRef<T | null>(null);
  const lastTouchYRef = useRef<number | null>(null);

  const scrollBy = (deltaY: number) => {
    if (Math.abs(deltaY) < MIN_SCROLL_DELTA) {
      return;
    }

    window.scrollBy({
      top: deltaY,
      left: 0,
      behavior: "auto",
    });
  };

  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < MIN_SCROLL_DELTA) {
        return;
      }

      event.preventDefault();
      scrollBy(event.deltaY);
    };

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const currentTouchY = event.touches[0]?.clientY;
      const lastTouchY = lastTouchYRef.current;

      if (typeof currentTouchY !== "number" || lastTouchY === null) {
        return;
      }

      const deltaY = lastTouchY - currentTouchY;
      lastTouchYRef.current = currentTouchY;

      if (Math.abs(deltaY) < MIN_SCROLL_DELTA) {
        return;
      }

      event.preventDefault();
      scrollBy(deltaY);
    };

    const handleTouchEnd = () => {
      lastTouchYRef.current = null;
    };

    hero.addEventListener("wheel", handleWheel, { passive: false });
    hero.addEventListener("touchstart", handleTouchStart, { passive: true });
    hero.addEventListener("touchmove", handleTouchMove, { passive: false });
    hero.addEventListener("touchend", handleTouchEnd);
    hero.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      hero.removeEventListener("wheel", handleWheel);
      hero.removeEventListener("touchstart", handleTouchStart);
      hero.removeEventListener("touchmove", handleTouchMove);
      hero.removeEventListener("touchend", handleTouchEnd);
      hero.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  return heroRef;
}
