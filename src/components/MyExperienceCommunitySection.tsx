"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import { ScrollReveal } from "@/components/ScrollReveal";

type CommunityItem = {
  number: string;
  title: string;
  description: string;
  image: string;
  size?: "narrow" | "medium";
};

type MyExperienceCommunitySectionProps = {
  kicker: string;
  title: string;
  description: string;
  items: CommunityItem[];
};

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="myExperienceCommunityActionIcon">
      <path
        d="M7 17 17 7M9 7h8v8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function MyExperienceCommunitySection({
  kicker,
  title,
  description,
  items,
}: MyExperienceCommunitySectionProps) {
  const accentColors = useMemo(
    () => [
      "120, 95, 255",
      "255, 170, 94",
      "86, 170, 255",
      "255, 108, 184",
      "186, 255, 116",
      "255, 214, 92",
    ],
    [],
  );
  const initialIndex = Math.min(2, Math.max(items.length - 1, 0));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeItem = items[activeIndex] ?? items[0];
  const cardWidths = useMemo(
    () =>
      items.map((item, index) => {
        if (index === activeIndex) return "minmax(280px, 2.4fr)";
        return item.size === "medium" ? "minmax(150px, 1.18fr)" : "minmax(118px, 0.86fr)";
      }),
    [activeIndex, items],
  );

  return (
    <section className="myExperiencePanel myExperienceCommunitySection" id="services">
      <div className="myExperienceCommunityContent">
        <div className="myExperienceCommunityIntro">
          <ScrollReveal as="p" className="myExperienceSectionKicker">
            {kicker}
          </ScrollReveal>
          <ScrollReveal as="h2" className="myExperienceCommunityTitle" delay={40}>
            {title}
          </ScrollReveal>
          <ScrollReveal as="p" className="myExperienceCommunityLead" delay={90}>
            {description}
          </ScrollReveal>
        </div>

        <ScrollReveal
          as="div"
          className="myExperienceCommunityRail"
          delay={140}
          style={{ gridTemplateColumns: cardWidths.join(" ") }}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <article
                key={item.number}
                className="myExperienceCommunityCard"
                data-active={isActive ? "true" : "false"}
                data-size={item.size ?? "narrow"}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                tabIndex={0}
                style={
                  {
                    "--community-accent": accentColors[index % accentColors.length],
                  } as CSSProperties
                }
              >
                <div className="myExperienceCommunityCardGlow" aria-hidden="true" />
                <div className="myExperienceCommunityCardSheen" aria-hidden="true" />
                <div className="myExperienceCommunityCardSurface">
                  <div className="myExperienceCommunityCardLabel">
                    <span className="myExperienceCommunityCardNumber">{item.number}</span>
                    <span className="myExperienceCommunityCardTitleVertical">{item.title}</span>
                  </div>

                  {isActive ? (
                    <div className="myExperienceCommunityCardExpanded">
                      <div className="myExperienceCommunityCardImageWrap">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 980px) 100vw, 34vw"
                          className="myExperienceServiceImage"
                        />
                      </div>
                      <div className="myExperienceCommunityCardCopy">
                        <p className="myExperienceCommunityCardEyebrow">{activeItem?.number}</p>
                        <h3 className="myExperienceCommunityCardTitle">{item.title}</h3>
                        <p className="myExperienceCommunityCardText">{item.description}</p>
                        <span className="myExperienceCommunityCardAction">
                          Explore the moment
                          <ArrowUpRightIcon />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="myExperienceCommunityCardCollapsed">
                      <span className="myExperienceCommunityCardMarker" />
                    </div>
                  )}
                  <div className="myExperienceCommunityCardChrome" aria-hidden="true" />
                </div>
              </article>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
}
