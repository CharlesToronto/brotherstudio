"use client";

import { useEffect } from "react";

export function MyExperienceAssistantToneObserver() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".myExperiencePage");
    const brochure = document.getElementById("brochure");
    const assistant = document.getElementById("assistant");
    if (!page || !brochure || !assistant) return;

    let frameId = 0;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));

    const updateTone = () => {
      const brochureRect = brochure.getBoundingClientRect();
      const assistantRect = assistant.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const fadeStart = viewportHeight * 0.92;
      const fadePeak = viewportHeight * 0.28;
      const fadeEnd = viewportHeight * 0.18;

      const brochureProgress = clamp(
        (fadeStart - brochureRect.top) / (fadeStart - fadePeak),
        0,
        1,
      );

      const assistantProgress = clamp(
        (fadeStart - assistantRect.top) / (fadeStart - fadeEnd),
        0,
        1,
      );

      const progress = clamp(Math.max(brochureProgress * 0.7, assistantProgress), 0, 1);

      page.style.setProperty("--assistant-tone-opacity", progress.toFixed(3));
      page.setAttribute("data-assistant-tone", progress > 0.02 ? "dark" : "default");
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateTone);
    };

    updateTone();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      page.style.removeProperty("--assistant-tone-opacity");
      page.setAttribute("data-assistant-tone", "default");
    };
  }, []);

  return null;
}
