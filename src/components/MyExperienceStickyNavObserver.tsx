"use client";

import { useEffect } from "react";

export function MyExperienceStickyNavObserver() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".myExperiencePage");
    const hero = document.querySelector<HTMLElement>(".myExperienceHero");

    if (!page || !hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        page.setAttribute(
          "data-hero-visible",
          entry.isIntersecting ? "true" : "false",
        );
      },
      {
        threshold: 0,
      },
    );

    observer.observe(hero);

    return () => {
      observer.disconnect();
      page.setAttribute("data-hero-visible", "true");
    };
  }, []);

  return null;
}
