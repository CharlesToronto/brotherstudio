"use client";

import { useEffect, useState } from "react";

export function MyExperienceScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const root = document.documentElement;
      const maxScroll = root.scrollHeight - window.innerHeight;

      if (maxScroll <= 0) {
        setProgress(0);
        return;
      }

      setProgress(Math.min(Math.max(window.scrollY / maxScroll, 0), 1));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="myExperienceScrollProgress" aria-hidden="true">
      <div
        className="myExperienceScrollProgressFill"
        style={{ transform: `scaleY(${progress})` }}
      />
    </div>
  );
}
