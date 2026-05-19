"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type ParallaxScrollFeature = {
  id: string | number;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt?: string;
  eyebrow?: string;
  reverse?: boolean;
};

type ParallaxScrollFeatureSectionProps = {
  sections?: ParallaxScrollFeature[];
  className?: string;
  showScrollCue?: boolean;
};

const defaultSections: ParallaxScrollFeature[] = [
  {
    id: 1,
    eyebrow: "01",
    title: "Feature 1",
    description:
      "Warm interiors, tactile materials and cinematic light shape the first impression of the residence.",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Modern home beside a lake at sunset",
    reverse: false,
  },
  {
    id: 2,
    eyebrow: "02",
    title: "Feature 2",
    description:
      "Alpine context, village proximity and landscape views build the atmosphere around daily life.",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Mountain landscape under evening light",
    reverse: true,
  },
  {
    id: 3,
    eyebrow: "03",
    title: "Feature 3",
    description:
      "Quiet rituals and shared moments turn the project from a property presentation into a lived mood.",
    imageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Night sky over mountains",
    reverse: false,
  },
];

function ParallaxScrollFeatureItem({
  section,
  index,
}: {
  section: ParallaxScrollFeature;
  index: number;
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 82%", "center 20%"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [56, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [0, 1]);
  const imageOpacity = useTransform(scrollYProgress, [0.05, 0.72], [0, 1]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);
  const clipPath = useTransform(
    scrollYProgress,
    [0.02, 0.72],
    section.reverse
      ? ["inset(0 0 0 100%)", "inset(0 0 0 0%)"]
      : ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
  );
  const isFirstSlide = index === 0;

  return (
    <section
      ref={sectionRef}
      className="parallaxScrollFeatureItem"
      data-reverse={section.reverse ? "true" : "false"}
    >
      <motion.div className="parallaxScrollFeatureCopy" style={{ y: contentY, opacity: isFirstSlide ? 1 : contentOpacity }}>
        <p className="parallaxScrollFeatureEyebrow">{section.eyebrow ?? String(index + 1).padStart(2, "0")}</p>
        <h3 className="parallaxScrollFeatureTitle">{section.title}</h3>
        <p className="parallaxScrollFeatureDescription">{section.description}</p>
      </motion.div>

      <motion.div className="parallaxScrollFeatureMedia" style={{ opacity: isFirstSlide ? 1 : imageOpacity, clipPath }}>
        <motion.img
          src={section.imageUrl}
          alt={section.imageAlt ?? section.title}
          className="parallaxScrollFeatureImage"
          style={{ scale: imageScale }}
        />
      </motion.div>
    </section>
  );
}

export function ParallaxScrollFeatureSection({
  sections = defaultSections,
  className,
  showScrollCue = false,
}: ParallaxScrollFeatureSectionProps) {
  return (
    <div className={cn("parallaxScrollFeatureSection", className)}>
      {showScrollCue ? (
        <p className="parallaxScrollFeatureCue">
          Scroll <ArrowDown size={15} strokeWidth={1.8} />
        </p>
      ) : null}

      <div className="parallaxScrollFeatureList">
        {sections.map((section, index) => (
          <ParallaxScrollFeatureItem key={section.id} section={section} index={index} />
        ))}
      </div>
    </div>
  );
}

export const Component = ParallaxScrollFeatureSection;
