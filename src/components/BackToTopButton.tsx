"use client";

import { useEffect, useRef, useState } from "react";

type BackToTopButtonProps = {
  label: string;
  footerLabel: string;
};

export function BackToTopButton({ label, footerLabel }: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const lastScrollY = useRef(0);

  useEffect(() => {
    const syncVisibility = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      setIsVisible(currentScrollY > 260);

      if (Math.abs(delta) > 3) {
        setDirection(delta > 0 ? "down" : "up");
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    syncVisibility();
    window.addEventListener("scroll", syncVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncVisibility);
    };
  }, []);

  if (!isVisible) return null;

  const buttonLabel = direction === "down" ? footerLabel : label;

  return (
    <button
      className="backToTopButton"
      type="button"
      aria-label={buttonLabel}
      data-direction={direction}
      onClick={() => {
        if (direction === "down") {
          document
            .getElementById("site-footer")
            ?.scrollIntoView({ block: "start", behavior: "auto" });
          return;
        }

        window.scrollTo({ top: 0, behavior: "auto" });
      }}
    >
      <svg
        className="backToTopIcon"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path
          d="M6 2.25 2.25 6M6 2.25 9.75 6M6 2.25V10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
