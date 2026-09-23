"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, stagger, useAnimate } from "motion/react";

import Floating, { FloatingElement } from "@/components/ui/parallax-floating";

const heroTiles = [
  {
    src: "/uploads/f62a9ee2-3c29-488d-8cd9-58dad61b4af3-1774898563984.webp",
    alt: "Atmosphère du séjour Mésange",
    className: "myExperienceHeroFloat1",
    depth: 0.7,
  },
  {
    src: "/uploads/afc57519-61e4-4225-bb43-8cdc51125275-1774016096392.webp",
    alt: "Rendu intérieur Mésange",
    className: "myExperienceHeroFloat2",
    depth: 1.2,
  },
  {
    src: "/uploads/d319f063-7b8b-41b2-857c-471d64d9083c-1774016140036.webp",
    alt: "Rendu salon Mésange",
    className: "myExperienceHeroFloat3",
    depth: 1.8,
  },
  {
    src: "/uploads/60dcacb8-447a-4eb2-b2c7-100a63eeee7d-1774016180346.webp",
    alt: "Rendu chambre Mésange",
    className: "myExperienceHeroFloat4",
    depth: 1,
  },
  {
    src: "/uploads/03315390-9045-44d2-9845-6f3c5783dc32-1774037083611.webp",
    alt: "Détail Mésange",
    className: "myExperienceHeroFloat5",
    depth: 2.4,
  },
] as const;

type MyExperienceParallaxHeroProps = {
  heroImage: string;
};

const HERO_BACKGROUND_VIDEO = "/myexperience-hero/mesange-hero-loop.mp4";

export function MyExperienceParallaxHero({ heroImage }: MyExperienceParallaxHeroProps) {
  const [scope, animate] = useAnimate();
  const [isVideoReady, setIsVideoReady] = useState(false);

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
        alt="Rendu architectural extérieur"
        fill
        priority
        sizes="100vw"
        className="myExperienceHeroImage"
        data-video-ready={isVideoReady ? "true" : "false"}
      />
      <video
        className="myExperienceHeroVideo"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={heroImage}
        aria-hidden="true"
        disablePictureInPicture
        onCanPlay={() => setIsVideoReady(true)}
      >
        <source src={HERO_BACKGROUND_VIDEO} type="video/mp4" />
      </video>
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
          <p className="myExperienceEyebrow">Présentation résidentielle cinématographique</p>
          <h1 className="myExperienceHeroTitle">MÉSANGE</h1>
          <p className="myExperienceHeroCopy">

          </p>
          <div className="myExperienceHeroMeta">
            <span>Suisse</span>
            <span>Résidence privée</span>
            <span>2026</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
