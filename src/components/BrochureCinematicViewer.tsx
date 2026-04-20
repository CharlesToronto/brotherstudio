"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  BrochureProject,
  BrochureSection,
  BrochureImageItem,
  BrochureCanvasItem,
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

function getCanvasTexts(layoutItems: BrochureCanvasItem[]): string[] {
  return layoutItems
    .filter((item): item is Extract<BrochureCanvasItem, { kind: "text" }> => item.kind === "text")
    .sort((a, b) => (b.fontSize ?? 16) - (a.fontSize ?? 16))
    .map((item) => item.textContent.trim())
    .filter(Boolean);
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

  const canvasTexts = getCanvasTexts(section.layoutItems);
  const effectiveTitle = section.title || canvasTexts[0] || "";
  const effectiveSubtitle = section.subtitle || (canvasTexts.length > 1 ? canvasTexts[1] : "") || "";
  const effectiveBody =
    section.body || (canvasTexts.length > 2 ? canvasTexts.slice(2).join(" — ") : "") || "";

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
              alt={images[0].label || effectiveTitle}
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
              {effectiveSubtitle}
            </span>
            <h2 className={isCover ? "cinematicCoverTitle cine-up-2" : "cinematicHeroTitle cine-up-2"}>
              {effectiveTitle}
            </h2>
            {effectiveBody && !isCover && (
              <p className="cinematicHeroBody cine-up-3">{effectiveBody}</p>
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
              <div key={img.id} className={`cinematicGalleryCell cine-cell-${i}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.label || effectiveTitle} className="cinematicBgImg" />
              </div>
            ))}
          </div>
          <div className="cinematicGalleryCaption">
            <span className="cinematicEyebrow cine-up-0">{effectiveSubtitle}</span>
            <h2 className="cinematicGalleryTitle cine-up-1">{effectiveTitle}</h2>
            {effectiveBody && (
              <p className="cinematicGalleryBody cine-up-2">{effectiveBody}</p>
            )}
          </div>
        </div>
      )}

      {layout === "split" && (
        <div className="cinematicSplitLayout">
          {images[0] && (
            <div className="cinematicSplitImage cine-cell-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[0].url} alt={images[0].label || effectiveTitle} className="cinematicBgImg" />
            </div>
          )}
          <div className="cinematicSplitText">
            <span className="cinematicEyebrow cine-up-1" style={{ color: accentColor }}>
              {effectiveSubtitle}
            </span>
            <h2 className="cinematicSplitTitle cine-up-2">{effectiveTitle}</h2>
            {effectiveBody && (
              <p className="cinematicSplitBody cine-up-3">{effectiveBody}</p>
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
          <span className="cinematicEyebrow cine-up-1">{effectiveSubtitle}</span>
          <h2
            className={
              layout === "dark"
                ? "cinematicDarkTitle cine-up-2"
                : "cinematicLightTitle cine-up-2"
            }
          >
            {effectiveTitle}
          </h2>
          {effectiveBody && (
            <p
              className={
                layout === "dark"
                  ? "cinematicDarkBody cine-up-3"
                  : "cinematicLightBody cine-up-3"
              }
            >
              {effectiveBody}
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

function distributeImages(
  sections: BrochureSection[],
  allImages: BrochureImageItem[],
): Map<string, BrochureImageItem[]> {
  const imageMap = new Map<string, BrochureImageItem>(
    allImages.map((img) => [img.id, img]),
  );

  const result = new Map<string, BrochureImageItem[]>();
  const used = new Set<string>();

  for (const section of sections) {
    const found = section.imageIds
      .map((id) => imageMap.get(id))
      .filter((img): img is BrochureImageItem => !!img);
    result.set(section.id, found);
    for (const img of found) used.add(img.id);
  }

  const remaining = allImages.filter((img) => !used.has(img.id));
  let ri = 0;

  for (const section of sections) {
    if (result.get(section.id)!.length > 0) continue;
    if (section.kind === "final" || section.kind === "cta" || section.kind === "advantages") continue;

    const count = section.kind === "cover" ? 1 : section.kind === "plans" || section.kind === "typologies" ? 1 : 3;
    const assigned = remaining.slice(ri, ri + count);
    if (assigned.length > 0) {
      result.set(section.id, assigned);
      ri += assigned.length;
    }
  }

  return result;
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
    () => new Set(sections.map((s) => s.id)),
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionImages = distributeImages(sections, allImages);

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
      { root, threshold: 0.05 },
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
        const images = sectionImages.get(section.id) ?? [];
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
