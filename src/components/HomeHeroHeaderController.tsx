"use client";

import { useEffect } from "react";

export function HomeHeroHeaderController() {
  useEffect(() => {
    const updateHeaderState = () => {
      document.body.classList.toggle(
        "homeSplineHeaderVisible",
        window.scrollY > window.innerHeight * 0.82,
      );
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("resize", updateHeaderState);

    return () => {
      document.body.classList.remove("homeSplineHeaderVisible");
      window.removeEventListener("scroll", updateHeaderState);
      window.removeEventListener("resize", updateHeaderState);
    };
  }, []);

  return null;
}
