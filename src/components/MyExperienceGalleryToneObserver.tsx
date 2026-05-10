"use client";

import { useEffect } from "react";

export function MyExperienceGalleryToneObserver() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".myExperiencePage");
    const gallery = document.getElementById("gallery");
    if (!page || !gallery) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        page.setAttribute(
          "data-gallery-tone",
          entry.isIntersecting ? "blue" : "default",
        );
      },
      {
        rootMargin: "-15% 0px -45% 0px",
        threshold: 0,
      },
    );

    observer.observe(gallery);

    return () => {
      observer.disconnect();
      page.setAttribute("data-gallery-tone", "default");
    };
  }, []);

  return null;
}
