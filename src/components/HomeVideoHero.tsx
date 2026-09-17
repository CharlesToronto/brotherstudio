"use client";

import { Dongle } from "next/font/google";
import { ArrowDown } from "lucide-react";

import { useHeroScrollBridge } from "@/hooks/useHeroScrollBridge";
import type { Locale } from "@/lib/i18n";

const dongle = Dongle({
  subsets: ["latin"],
  weight: ["300"],
});

export function HomeVideoHero({ locale }: { locale: Locale }) {
  const heroScrollBridgeRef = useHeroScrollBridge<HTMLElement>();
  const isFrench = locale === "fr";

  return (
    <section
      ref={heroScrollBridgeRef}
      className="homeBlurWordSection"
      aria-label={isFrench ? "Hero vidéo BrotherStudio" : "BrotherStudio video hero"}
    >
      <video
        className="homeVideoHeroMedia"
        src="/videos/bs-home-hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />

      <div className="homeHeroOverlay">
        <div className={`homeHeroCopy ${dongle.className}`}>
          <p className="homeHeroEyebrow">
            {isFrench ? "Du plan à la vente." : "From Plan to Sale."}
          </p>
          <h1 className="homeHeroTitle">BROTHERSTUDIO</h1>
          <div className="homeHeroValue">
            <p className="homeHeroValueText">
              {isFrench
                ? "Brother Studio est une agence de marketing immobilier qui aide les promoteurs à lancer, commercialiser et vendre leurs projets grâce à l’image de marque, la 3D, les sites web, la publicité et la génération de prospects qualifiés."
                : "Brother Studio is a property marketing company that helps developers launch, commercialize and sell new real estate developments through branding, CGI, websites, advertising and qualified lead generation."}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="homeHeroScrollButton"
          aria-label={isFrench ? "Accéder à la galerie" : "Enter gallery"}
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
