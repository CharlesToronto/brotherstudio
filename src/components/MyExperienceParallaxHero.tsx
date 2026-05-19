"use client";

import Image from "next/image";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "motion/react";

import Floating, { FloatingElement } from "@/components/ui/parallax-floating";

const heroTiles = [
  {
    src: "/uploads/f62a9ee2-3c29-488d-8cd9-58dad61b4af3-1774898563984.webp",
    alt: "Mesange living atmosphere",
    className: "myExperienceHeroFloat1",
    depth: 0.7,
  },
  {
    src: "/uploads/afc57519-61e4-4225-bb43-8cdc51125275-1774016096392.webp",
    alt: "Mesange interior render",
    className: "myExperienceHeroFloat2",
    depth: 1.2,
  },
  {
    src: "/uploads/d319f063-7b8b-41b2-857c-471d64d9083c-1774016140036.webp",
    alt: "Mesange lounge render",
    className: "myExperienceHeroFloat3",
    depth: 1.8,
  },
  {
    src: "/uploads/60dcacb8-447a-4eb2-b2c7-100a63eeee7d-1774016180346.webp",
    alt: "Mesange bedroom render",
    className: "myExperienceHeroFloat4",
    depth: 1,
  },
  {
    src: "/uploads/03315390-9045-44d2-9845-6f3c5783dc32-1774037083611.webp",
    alt: "Mesange detail render",
    className: "myExperienceHeroFloat5",
    depth: 2.4,
  },
] as const;

type MyExperienceParallaxHeroProps = {
  heroImage: string;
};

export function MyExperienceParallaxHero({ heroImage }: MyExperienceParallaxHeroProps) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    void animate(
      ".myExperienceHeroFloatingImage",
      { opacity: [0, 1], y: [18, 0], scale: [0.96, 1] },
      { duration: 0.72, delay: stagger(0.12), ease: [0.22, 1, 0.36, 1] },
    );
  }, [animate]);

  return (
    <section className="myExperienceHero myExperienceParallaxHero" ref={scope}>
      <Image
        src={heroImage}
        alt="Luxury architectural exterior render"
        fill
        priority
        sizes="100vw"
        className="myExperienceHeroImage"
      />
      <div className="myExperienceHeroOverlay" />

      <Floating sensitivity={-1.1} easingFactor={0.055} className="myExperienceHeroFloating">
        {heroTiles.map((tile) => (
          <FloatingElement key={tile.src} depth={tile.depth} className={tile.className}>
            <motion.div className="myExperienceHeroFloatingImage" initial={{ opacity: 0 }}>
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                sizes="(max-width: 768px) 28vw, 18vw"
                className="myExperienceHeroFloatingMedia"
              />
            </motion.div>
          </FloatingElement>
        ))}
      </Floating>

      <div className="myExperienceShell myExperienceParallaxHeroShell">
        <motion.div
          className="myExperienceHeroCard myExperienceParallaxHeroCard"
          initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="myExperienceEyebrow">Cinematic Residential Presentation</p>
          <h1 className="myExperienceHeroTitle">MESANGE</h1>
          <p className="myExperienceHeroCopy">
             
          </p>
          <div className="myExperienceHeroMeta">
            <span>Switzerland</span>
            <span>Private Residence</span>
            <span>2026</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
