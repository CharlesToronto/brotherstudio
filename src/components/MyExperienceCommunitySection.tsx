"use client";

import { ScrollReveal } from "@/components/ScrollReveal";
import { ParallaxScrollFeatureSection } from "@/components/ui/parallax-scroll-feature-section";

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

export function MyExperienceCommunitySection({
  kicker,
  title,
  description,
  items,
}: MyExperienceCommunitySectionProps) {
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

        <ParallaxScrollFeatureSection
          sections={items.map((item, index) => ({
            id: item.number,
            eyebrow: item.number,
            title: item.title,
            description: item.description,
            imageUrl: item.image,
            imageAlt: item.title,
            reverse: index % 2 === 1,
          }))}
        />
      </div>
    </section>
  );
}
