"use client";

import { useEffect, useState } from "react";
import { Dongle } from "next/font/google";
import { ArrowDown } from "lucide-react";

import InfiniteGallery from "@/components/ui/3d-gallery-photography";
import type { GalleryItem } from "@/lib/galleryStore";

const dongle = Dongle({
  subsets: ["latin"],
  weight: ["300"],
});
const MOBILE_HERO_MEDIA_QUERY = "(max-width: 640px)";

type HomeBlurWordSectionProps = {
  items: GalleryItem[];
};

export function HomeBlurWordSection({ items }: HomeBlurWordSectionProps) {
  const [isMobileHero, setIsMobileHero] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_HERO_MEDIA_QUERY);

    const syncMobileHero = () => {
      const nextIsMobile = mediaQuery.matches;
      setIsMobileHero(nextIsMobile);

      if (nextIsMobile) {
        document.documentElement.classList.add("homeHeroMobileScrollLocked");
        document.body.classList.add("homeHeroMobileScrollLocked");
      } else {
        document.documentElement.classList.remove("homeHeroMobileScrollLocked");
        document.body.classList.remove("homeHeroMobileScrollLocked");
      }
    };

    syncMobileHero();
    mediaQuery.addEventListener("change", syncMobileHero);

    return () => {
      mediaQuery.removeEventListener("change", syncMobileHero);
      document.documentElement.classList.remove("homeHeroMobileScrollLocked");
      document.body.classList.remove("homeHeroMobileScrollLocked");
    };
  }, []);

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
          <p className="homeHeroEyebrow">Selected Works</p>
          <h1 className="homeHeroTitle">BROTHERSTUDIO</h1>
        </div>
        <button
          type="button"
          className="homeHeroScrollButton"
          onClick={() => {
            if (isMobileHero) {
              document.documentElement.classList.remove("homeHeroMobileScrollLocked");
              document.body.classList.remove("homeHeroMobileScrollLocked");
            }
            document.getElementById("home-gallery-grid")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          Gallery
          <ArrowDown size={18} strokeWidth={1.8} />
        </button>
      </div>
    </section>
  );
}
