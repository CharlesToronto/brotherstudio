"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { getBrochureSectionDefinition } from "@/lib/brochureSections";
import type {
  BrochureImageItem,
  BrochureImmersiveSettings,
  BrochureSection,
  BrochureStyleSettings,
} from "@/lib/brochureTypes";

type BrochureImmersiveProps = {
  projectName: string;
  title: string;
  subtitle: string;
  body: string;
  styleSettings: BrochureStyleSettings;
  immersiveSettings: BrochureImmersiveSettings;
  sections: BrochureSection[];
  images: BrochureImageItem[];
};

function buildImageMap(images: BrochureImageItem[]) {
  return new Map(images.map((image) => [image.id, image]));
}

export function BrochureImmersive({
  projectName,
  title,
  subtitle,
  body,
  styleSettings,
  immersiveSettings,
  sections,
  images,
}: BrochureImmersiveProps) {
  const imageMap = useMemo(() => buildImageMap(images), [images]);
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const effectiveActiveSectionId = sections.some((section) => section.id === activeSectionId)
    ? activeSectionId
    : sections[0]?.id ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-immersive-section-id]"),
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const sectionId = visible?.target.getAttribute("data-immersive-section-id");
        if (sectionId) {
          setActiveSectionId(sectionId);
        }
      },
      {
        threshold: [0.2, 0.4, 0.6, 0.8],
        rootMargin: "-10% 0px -10% 0px",
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sections]);

  const coverSection = sections[0] ?? null;
  const heroImage = coverSection?.imageIds[0] ? imageMap.get(coverSection.imageIds[0]) : null;

  return (
    <section
      className="brochureImmersiveShell"
      data-theme={immersiveSettings.theme}
      data-motion={immersiveSettings.motionPreset}
      style={
        {
          "--immersive-accent-color": styleSettings.accentColor,
          "--immersive-background-color": styleSettings.backgroundColor,
          "--immersive-font-family": 'var(--brochure-font-family, "Helvetica Neue", Helvetica, Arial, sans-serif)',
        } as CSSProperties
      }
    >
      {immersiveSettings.showProgressNav ? (
        <nav className="brochureImmersiveNav" aria-label="Immersive sections">
          {sections.map((section, index) => {
            const sectionLabel =
              getBrochureSectionDefinition(section.kind)?.label || `Section ${index + 1}`;

            return (
              <a
                key={section.id}
                className="brochureImmersiveNavItem"
                href={`#immersive-${section.id}`}
                data-active={effectiveActiveSectionId === section.id ? "true" : "false"}
              >
                <span className="brochureImmersiveNavIndex">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="brochureImmersiveNavLabel">
                  {section.title || sectionLabel}
                </span>
              </a>
            );
          })}
        </nav>
      ) : null}

      <header
        id={coverSection ? `immersive-${coverSection.id}` : undefined}
        className="brochureImmersiveHero"
        data-immersive-section-id={coverSection?.id ?? ""}
      >
        {heroImage ? (
          <div className="brochureImmersiveHeroMedia">
            <img src={heroImage.url} alt={heroImage.label} />
          </div>
        ) : null}
        <div className="brochureImmersiveHeroOverlay" />
        <div className="brochureImmersiveHeroInner">
          <p className="brochureImmersiveEyebrow">{projectName}</p>
          <h1 className="brochureImmersiveTitle">{title}</h1>
          {subtitle ? <p className="brochureImmersiveSubtitle">{subtitle}</p> : null}
          {body ? <p className="brochureImmersiveLead">{body}</p> : null}
        </div>
      </header>

      <div className="brochureImmersiveSections">
        {sections.slice(1).map((section, index) => {
          const sectionImages = section.imageIds
            .map((imageId) => imageMap.get(imageId))
            .filter((image): image is BrochureImageItem => Boolean(image));
          const leadImage = sectionImages[0] ?? null;
          const chapterLabel =
            getBrochureSectionDefinition(section.kind)?.label ||
            `Section ${index + 2}`;

          return (
            <section
              key={section.id}
              id={`immersive-${section.id}`}
              className="brochureImmersiveSection"
              data-layout={index % 2 === 0 ? "media-left" : "media-right"}
              data-immersive-section-id={section.id}
            >
              <div className="brochureImmersiveSectionInner">
                <div className="brochureImmersiveSectionCopy">
                  <p className="brochureImmersiveSectionLabel">{chapterLabel}</p>
                  <h2 className="brochureImmersiveSectionTitle">
                    {section.title || chapterLabel}
                  </h2>
                  {section.subtitle ? (
                    <p className="brochureImmersiveSectionSubtitle">{section.subtitle}</p>
                  ) : null}
                  {section.body ? (
                    <p className="brochureImmersiveSectionBody">{section.body}</p>
                  ) : null}
                </div>

                <div className="brochureImmersiveSectionMedia">
                  {leadImage ? (
                    <figure className="brochureImmersiveFigure">
                      <img src={leadImage.url} alt={leadImage.label} />
                    </figure>
                  ) : (
                    <div className="brochureImmersiveMediaPlaceholder">
                      Add an image to strengthen this chapter.
                    </div>
                  )}

                  {sectionImages.length > 1 ? (
                    <div className="brochureImmersiveThumbGrid">
                      {sectionImages.slice(1, 4).map((image) => (
                        <figure key={image.id} className="brochureImmersiveThumb">
                          <img src={image.url} alt={image.label} />
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
