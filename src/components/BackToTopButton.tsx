"use client";

import { useEffect, useState } from "react";

type BackToTopButtonProps = {
  label: string;
};

export function BackToTopButton({ label }: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const syncVisibility = () => {
      setIsVisible(window.scrollY > 260);
    };

    syncVisibility();
    window.addEventListener("scroll", syncVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncVisibility);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <button
      className="backToTopButton"
      type="button"
      aria-label={label}
      onClick={() => {
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
