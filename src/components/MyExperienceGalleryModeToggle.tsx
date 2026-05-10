"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useEffect, useRef, useState } from "react";

export function MyExperienceGalleryModeToggle() {
  const [mode, setMode] = useState<"day" | "night">("day");
  const [pendingMode, setPendingMode] = useState<"day" | "night" | null>(null);
  const [isTransitionVisible, setIsTransitionVisible] = useState(false);
  const switchTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const page = document.querySelector(".myExperiencePage");
    if (!page) return;

    page.setAttribute("data-gallery-mode", mode);
  }, [mode]);

  useEffect(() => {
    return () => {
      if (switchTimerRef.current !== null) {
        window.clearTimeout(switchTimerRef.current);
      }
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleModeChange = (nextMode: "day" | "night") => {
    if (nextMode === mode || pendingMode !== null) return;

    if (switchTimerRef.current !== null) {
      window.clearTimeout(switchTimerRef.current);
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    setPendingMode(nextMode);
    setIsTransitionVisible(true);

    switchTimerRef.current = window.setTimeout(() => {
      setMode(nextMode);
    }, 1100);

    closeTimerRef.current = window.setTimeout(() => {
      setIsTransitionVisible(false);
      setPendingMode(null);
      switchTimerRef.current = null;
      closeTimerRef.current = null;
    }, 2400);
  };

  return (
    <>
      <div className="myExperienceGalleryModeToggle" aria-label="Gallery lighting mode">
        <button
          type="button"
          className="myExperienceGalleryModeOption"
          data-active={mode === "day" ? "true" : "false"}
          disabled={pendingMode !== null}
          onClick={() => handleModeChange("day")}
        >
          Day
        </button>
        <button
          type="button"
          className="myExperienceGalleryModeOption"
          data-active={mode === "night" ? "true" : "false"}
          disabled={pendingMode !== null}
          onClick={() => handleModeChange("night")}
        >
          Night
        </button>
      </div>

      <div
        className="myExperienceGalleryModePopup"
        data-open={isTransitionVisible ? "true" : "false"}
        data-mode={pendingMode ?? mode}
        aria-hidden={isTransitionVisible ? "false" : "true"}
      >
        <div className="myExperienceGalleryModePopupCard">
          <DotLottieReact
            key={`${pendingMode ?? mode}-${isTransitionVisible ? "open" : "closed"}`}
            src="https://lottie.host/f0c26897-512f-44ea-bbc3-b2f6fa2fdf9e/EYcgzIUvR5.lottie"
            loop
            autoplay
          />
        </div>
      </div>
    </>
  );
}
