"use client";

import { useEffect } from "react";

export function LandingBackgroundTransition({
  pageId = "valuation-funnel",
  triggerSelector = "#contact",
}: { pageId?: string; triggerSelector?: string }) {
  useEffect(() => {
    const funnel = document.getElementById(pageId);
    const contact = funnel?.querySelector<HTMLElement>(triggerSelector);
    if (!funnel || !contact) return;

    const surfaces = [document.documentElement, document.body];
    const previous = surfaces.map((surface) => ({
      value: surface.style.getPropertyValue("--site-background-rgb"),
      priority: surface.style.getPropertyPriority("--site-background-rgb"),
      headerColor: surface.style.getPropertyValue("--valuation-header-color"),
      footerProgress: surface.style.getPropertyValue("--valuation-footer-progress"),
    }));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = 0;
    let target = 0;
    let frame = 0;
    let lastTime = 0;
    let measured = false;

    function paint(progress: number) {
      if (!funnel) return;
      const blend = (from: number[], to: number[]) => from.map((channel, i) => Math.round(channel + (to[i] - channel) * progress)).join(" ");
      const background = blend([226, 229, 233], [5, 12, 28]);
      funnel.style.setProperty("--landing-background-rgb", background);
      funnel.style.setProperty("--landing-text-rgb", progress > 0.45 ? "246 247 255" : "25 65 143");
      funnel.style.setProperty("--landing-body-rgb", progress > 0.45 ? "215 222 235" : "55 65 81");
      funnel.style.setProperty("--landing-contact-progress", progress.toFixed(3));
      funnel.dataset.contactTheme = progress > 0.45 ? "dark" : "light";
      for (const surface of surfaces) {
        surface.style.setProperty("--site-background-rgb", background);
        surface.style.setProperty("--valuation-footer-progress", progress.toFixed(3));
        surface.style.setProperty("--valuation-header-color", progress > 0.45 ? "#fff" : "#000");
      }
    }

    function animate(timestamp: number) {
      frame = 0;
      const elapsed = lastTime ? Math.min(timestamp - lastTime, 64) : 16.67;
      lastTime = timestamp;
      current += (target - current) * (1 - Math.exp(-elapsed / 120));
      if (Math.abs(target - current) < 0.001) current = target;
      paint(current);
      if (current !== target) frame = window.requestAnimationFrame(animate);
      else lastTime = 0;
    }

    function sync() {
      if (!contact) return;
      // A trigger already visible at the top must not leave the page partially dark.
      const triggerTop = contact.getBoundingClientRect().top + window.scrollY;
      const start = Math.min(window.innerHeight * 0.85, triggerTop);
      const end = start - window.innerHeight * 0.6;
      target = Math.min(1, Math.max(0, (start - contact.getBoundingClientRect().top) / (start - end)));
      if (!measured || reducedMotion.matches) {
        measured = true;
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        current = target;
        paint(current);
      } else if (!frame) frame = window.requestAnimationFrame(animate);
    }

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    reducedMotion.addEventListener("change", sync);
    const observer = new ResizeObserver(sync);
    observer.observe(funnel);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      reducedMotion.removeEventListener("change", sync);
      observer.disconnect();
      for (const property of ["--landing-background-rgb", "--landing-text-rgb", "--landing-body-rgb", "--landing-contact-progress"]) funnel.style.removeProperty(property);
      delete funnel.dataset.contactTheme;
      surfaces.forEach((surface, i) => {
        if (previous[i].footerProgress) surface.style.setProperty("--valuation-footer-progress", previous[i].footerProgress);
        else surface.style.removeProperty("--valuation-footer-progress");
        if (previous[i].headerColor) surface.style.setProperty("--valuation-header-color", previous[i].headerColor);
        else surface.style.removeProperty("--valuation-header-color");
        if (previous[i].value) surface.style.setProperty("--site-background-rgb", previous[i].value, previous[i].priority);
        else surface.style.removeProperty("--site-background-rgb");
      });
    };
  }, [pageId, triggerSelector]);

  return null;
}
