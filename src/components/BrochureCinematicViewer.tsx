"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  BrochureProject,
  BrochureSection,
  BrochureImageItem,
} from "@/lib/brochureTypes";

type CinematicLayout = "hero" | "gallery" | "split" | "dark" | "light";

function getCinematicLayout(section: BrochureSection, imageCount: number): CinematicLayout {
  if (
    section.kind === "plans" ||
    section.kind === "typologies" ||
    section.kind === "practical"
  ) {
    return imageCount > 0 ? "split" : "light";
  }
  if (
    section.kind === "advantages" ||
    section.kind === "cta" ||
    section.kind === "final"
  ) {
    return "dark";
  }
  if (imageCount === 0) return "dark";
  if (imageCount >= 3) return "gallery";
  return "hero";
}

type SectionProps = {
  section: BrochureSection;
  images: BrochureImageItem[];
  index: number;
  isVisible: boolean;
  logoUrl?: string | null;
  accentColor: string;
  onScrollNext: () => void;
};

function CinematicSectionBlock({
  section,
  images,
  index,
  isVisible,
  logoUrl,
  accentColor,
  onScrollNext,
}: SectionProps) {
  const layout = getCinematicLayout(section, images.length);
  const isCover = index === 0;

  return (
    <section
      className="cinematicSection"
      data-layout={layout}
      data-kind={section.kind}
      data-visible={isVisible ? "true" : "false"}
      data-section-id={section.id}
      data-section-index={String(index)}
    >
      {layout === "hero" && images[0] && (
        <>
          <div className="cinematicBg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0].url}
              alt={images[0].label || section.title}
              className="cinematicBgImg"
            />
          </div>
          <div className="cinematicOverlay" data-cover={isCover ? "true" : "false"} />
          <div className="cinematicHeroContent">
            {isCover && logoUrl && (
              <div className="cinematicCoverLogo cine-up-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Studio logo"
                  className="cinematicLogoImg"
                />
              </div>
            )}
            <span className="cinematicEyebrow cine-up-1">
              {section.subtitle || ""}
            </span>
            <h2 className={isCover ? "cinematicCoverTitle cine-up-2" : "cinematicHeroTitle cine-up-2"}>
              {section.title}
            </h2>
            {section.body && !isCover && (
              <p className="cinematicHeroBody cine-up-3">{section.body}</p>
            )}
            {isCover && (
              <button
                className="cinematicScrollHint cine-up-4"
                type="button"
                onClick={onScrollNext}
              >
                <span>Scroll</span>
                <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
                  <path
                    d="M6 2v12M2 10l4 6 4-6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </>
      )}

      {layout === "gallery" && (
        <div className="cinematicGalleryLayout">
          <div
            className="cinematicGalleryGrid"
            data-count={String(Math.min(images.length, 4))}
          >
            {images.slice(0, 4).map((img, i) => (
              <div key={img.id} className={`cinematicGalleryCell cine-up-${i}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.label || section.title} className="cinematicBgImg" />
              </div>
            ))}
          </div>
          <div className="cinematicGalleryCaption">
            <span className="cinematicEyebrow cine-up-0">{section.subtitle}</span>
            <h2 className="cinematicGalleryTitle cine-up-1">{section.title}</h2>
          </div>
        </div>
      )}

      {layout === "split" && (
        <div className="cinematicSplitLayout">
          {images[0] && (
            <div className="cinematicSplitImage cine-up-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[0].url} alt={images[0].label || section.title} className="cinematicBgImg" />
            </div>
          )}
          <div className="cinematicSplitText">
            <span className="cinematicEyebrow cine-up-1" style={{ color: accentColor }}>
              {section.subtitle}
            </span>
            <h2 className="cinematicSplitTitle cine-up-2">{section.title}</h2>
            {section.body && (
              <p className="cinematicSplitBody cine-up-3">{section.body}</p>
            )}
          </div>
        </div>
      )}

      {(layout === "dark" || layout === "light") && (
        <div className="cinematicTextContent" data-layout={layout}>
          {layout === "dark" && section.kind === "final" && logoUrl && (
            <div className="cinematicFinalLogo cine-up-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Studio logo" className="cinematicLogoImg" />
            </div>
          )}
          <span className="cinematicEyebrow cine-up-1">{section.subtitle}</span>
          <h2
            className={
              layout === "dark"
                ? "cinematicDarkTitle cine-up-2"
                : "cinematicLightTitle cine-up-2"
            }
          >
            {section.title}
          </h2>
          {section.body && (
            <p
              className={
                layout === "dark"
                  ? "cinematicDarkBody cine-up-3"
                  : "cinematicLightBody cine-up-3"
              }
            >
              {section.body}
            </p>
          )}
          {section.socialLinks &&
            Object.values(section.socialLinks).some(Boolean) && (
              <div className="cinematicSocials cine-up-4">
                {Object.entries(section.socialLinks).map(([key, url]) =>
                  url ? (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cinematicSocialLink"
                    >
                      {key}
                    </a>
                  ) : null,
                )}
              </div>
            )}
        </div>
      )}
    </section>
  );
}

export function BrochureCinematicViewer({ project }: { project: BrochureProject }) {
  const allImages: BrochureImageItem[] = [
    ...project.approvedImages,
    ...project.extraAssets,
  ];
  const sections = project.content.sections;
  const { accentColor, logoUrl } = project.styleSettings;

  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    () => new Set(sections[0] ? [sections[0].id] : []),
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const getSectionImages = (section: BrochureSection): BrochureImageItem[] =>
    section.imageIds
      .map((id) => allImages.find((img) => img.id === id))
      .filter((img): img is BrochureImageItem => !!img);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section-id");
            if (id) setVisibleSections((prev) => new Set([...prev, id]));
          }
        });
      },
      { root, threshold: 0.1 },
    );

    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-section-index"));
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root, threshold: 0.45 },
    );

    const els = root.querySelectorAll("[data-section-id]");
    els.forEach((el) => {
      visibilityObserver.observe(el);
      activeObserver.observe(el);
    });

    return () => {
      visibilityObserver.disconnect();
      activeObserver.disconnect();
    };
  }, [sections.length]);

  const scrollToSection = (index: number) => {
    const el = containerRef.current?.querySelector(`[data-section-index="${index}"]`);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={containerRef}
      className="cinematicViewer"
      style={{ "--cine-accent": accentColor } as React.CSSProperties}
    >
      <header className="cinematicHeader">
        <span className="cinematicHeaderTitle">{project.name}</span>
        <Link
          href={`/mybrochure/${project.projectId}?edit=1`}
          className="cinematicHeaderEdit"
        >
          ← Editor
        </Link>
      </header>

      <nav className="cinematicNav" aria-label="Sections">
        {sections.map((section, i) => (
          <button
            key={section.id}
            className="cinematicNavDot"
            data-active={i === activeIndex ? "true" : "false"}
            type="button"
            onClick={() => scrollToSection(i)}
            title={section.title}
          />
        ))}
      </nav>

      {sections.map((section, index) => {
        const images = getSectionImages(section);
        const isVisible = visibleSections.has(section.id);

        return (
          <CinematicSectionBlock
            key={section.id}
            section={section}
            images={images}
            index={index}
            isVisible={isVisible}
            logoUrl={logoUrl}
            accentColor={accentColor}
            onScrollNext={() => scrollToSection(1)}
          />
        );
      })}
    </div>
  );
}
