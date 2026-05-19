"use client";

import { useLayoutEffect } from "react";

export function MyExperienceChromeHider() {
  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>("header.siteHeader");
    const footer = document.querySelector<HTMLElement>("footer.siteFooter");
    const previousHeaderDisplay = header?.style.display ?? "";
    const previousFooterDisplay = footer?.style.display ?? "";

    if (header) {
      header.style.display = "none";
    }

    if (footer) {
      footer.style.display = "none";
    }

    return () => {
      if (header) {
        header.style.display = previousHeaderDisplay;
      }

      if (footer) {
        footer.style.display = previousFooterDisplay;
      }
    };
  }, []);

  return null;
}
