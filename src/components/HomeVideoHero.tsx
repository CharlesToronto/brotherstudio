"use client";

import { Dongle } from "next/font/google";
import Link from "next/link";

import { useHeroScrollBridge } from "@/hooks/useHeroScrollBridge";
import { withLocalePath, type Locale } from "@/lib/i18n";

const dongle = Dongle({
  subsets: ["latin"],
  weight: ["300"],
});

export function HomeVideoHero({ locale }: { locale: Locale }) {
  const heroScrollBridgeRef = useHeroScrollBridge<HTMLElement>();
  const isFrench = locale === "fr";
  const listingsHref = withLocalePath(locale, "/immobilier");

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
            {isFrench ? "De l’idée à la vente." : "From idea to sale."}
          </p>
          <h1 className="homeHeroTitle">BROTHERSTUDIO</h1>
          <div className="homeHeroValue">
            <p className="homeHeroValueText">
              {isFrench
                ? "Brother Studio est une agence de marketing immobilier qui aide les promoteurs à lancer, commercialiser et vendre leurs projets grâce à l’image de marque, la 3D, les sites web, la publicité et la génération de prospects qualifiés."
                : "Brother Studio is a property marketing company that helps developers launch, commercialize and sell new real estate developments through branding, CGI, websites, advertising and qualified lead generation."}
            </p>
          </div>
          <div className="realEstateHeroActions homeHeroActions">
            <Link className="realEstateHeroActionPrimary" href={listingsHref}>Découvrir nos biens <span aria-hidden="true">↗</span></Link>
            <a className="realEstateHeroActionSecondary realEstateHeroActionNeon homeHeroActionNeon" href="#home-capabilities-title">Commercialiser mon projet <span aria-hidden="true">↗</span></a>
          </div>
        </div>

      </div>
    </section>
  );
}
