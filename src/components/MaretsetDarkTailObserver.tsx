"use client";

import { useEffect } from "react";

export function MaretsetDarkTailObserver() {
  useEffect(() => {
    const darkTail = document.querySelector<HTMLElement>(".maretsetWebsiteDarkTail");

    if (!darkTail) return;

    let frameId = 0;

    const updateDarkTailState = () => {
      window.cancelAnimationFrame(frameId);

      frameId = window.requestAnimationFrame(() => {
        const rect = darkTail.getBoundingClientRect();
        const activationPoint = window.innerHeight * 0.68;
        const isActive = rect.top <= activationPoint;

        darkTail.classList.toggle("maretsetWebsiteDarkTailIsVisible", isActive);
        document.body.classList.toggle("maretsetWebsiteDarkTailActive", isActive);
      });
    };

    updateDarkTailState();
    window.addEventListener("scroll", updateDarkTailState, { passive: true });
    window.addEventListener("resize", updateDarkTailState);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateDarkTailState);
      window.removeEventListener("resize", updateDarkTailState);
      darkTail.classList.remove("maretsetWebsiteDarkTailIsVisible");
      document.body.classList.remove("maretsetWebsiteDarkTailActive");
    };
  }, []);

  return null;
}
