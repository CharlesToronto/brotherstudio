"use client";

import { Dongle } from "next/font/google";
import { ArrowDown } from "lucide-react";

import InfiniteGallery from "@/components/ui/3d-gallery-photography";
import type { GalleryItem } from "@/lib/galleryStore";

const dongle = Dongle({
  subsets: ["latin"],
  weight: ["300"],
});

type HomeBlurWordSectionProps = {
  items: GalleryItem[];
};

export function HomeBlurWordSection({ items }: HomeBlurWordSectionProps) {
  const heroImages = items
    .filter((item) => item.architect.trim().toUpperCase() !== "BS")
    .slice(0, 8)
    .map((item) => ({
      src: item.src,
      alt: item.architect?.trim() || "BrotherStudio gallery image",
    }));

  return (
    <section className="homeBlurWordSection" aria-label="BrotherStudio gallery hero">
      <InfiniteGallery
        images={heroImages}
        speed={1.8}
        zSpacing={3}
        visibleCount={3}
        falloff={{ near: 0.8, far: 14 }}
        className="homeHero3dGallery"
      />

      <div className="homeHeroOverlay">
        <div className={`homeHeroCopy ${dongle.className}`}>
          <p className="homeHeroEyebrow">From Plan to Sale.</p>
          <h1 className="homeHeroTitle">BROTHERSTUDIO</h1>
          <div className="homeHeroValue">
            <p className="homeHeroValueText">
              Brother Studio is a property marketing company that helps developers launch,
              commercialize and sell new real estate developments through branding, CGI,
              websites, advertising and qualified lead generation.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="homeHeroScrollButton"
          aria-label="Enter"
          onClick={() => {
            document.getElementById("home-capabilities-title")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          <span className="homeHeroScrollButtonIcon" aria-hidden="true">
            <ArrowDown size={24} strokeWidth={1.9} />
          </span>
        </button>
      </div>
    </section>
  );
}
