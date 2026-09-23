"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type CSSProperties } from "react";

const sections = [
  { id: "top", label: "Début" },
  { id: "environnement", label: "Environnement" },
  { id: "plans", label: "Plans" },
  { id: "construction", label: "Construction" },
  { id: "gallery", label: "Galerie" },
  { id: "appartement", label: "Disponibilité" },
  { id: "contact", label: "Contact" },
];

export function PlantazProgressRail() {
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("top");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(maxScroll > 0 ? Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100)) : 0);

      const marker = window.scrollY + window.innerHeight * 0.32;
      let current = sections[0].id;
      sections.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element && element.offsetTop <= marker) current = id;
      });
      setActiveSection(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <aside className="plantazProgressRail" aria-label="Progression du site Plantaz" style={{ "--plantaz-progress": `${progress}%` } as CSSProperties}>
      <div className="plantazProgressRailHeader"><strong>Plantaz</strong><span>{Math.round(progress)}%</span></div>
      <div className="plantazProgressRailLine" aria-hidden="true"><span /></div>
      <nav aria-label="Sections du site Plantaz">
        {sections.map((section) => (
          <a key={section.id} className={activeSection === section.id ? "is-active" : ""} href={`#${section.id}`} aria-current={activeSection === section.id ? "location" : undefined}>
            <span className="plantazProgressRailDot" aria-hidden="true" />
            <span>{section.label}</span>
          </a>
        ))}
      </nav>
    </aside>,
    document.body,
  );
}
