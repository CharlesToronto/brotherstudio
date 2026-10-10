"use client";

import { Dongle } from "next/font/google";
import Link from "next/link";

import { withLocalePath, type Locale } from "@/lib/i18n";

const dongle = Dongle({
  subsets: ["latin"],
  weight: ["300"],
});

export function HomeVideoHero({ locale }: { locale: Locale }) {
  const isFrench = locale === "fr";

  return (
    <section
      className="homeBlurWordSection"
      aria-label={isFrench ? "Hero vidéo BrotherStudio" : "BrotherStudio video hero"}
    >
      <div className="homeHeroOverlay" style={{ isolation: "isolate", background: "none" }}>
        <video
          className="homeVideoHeroMedia"
          src="/videos/bs-home-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: -2 }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            pointerEvents: "none",
            background: "linear-gradient(180deg, rgb(0 0 0 / .18) 0%, rgb(0 0 0 / .03) 26%, rgb(0 0 0 / .02) 68%, rgb(0 0 0 / .62) 100%)",
          }}
        />
        <div className={`homeHeroCopy ${dongle.className}`}>
          <p className="homeHeroEyebrow">
            {isFrench ? "De l’idée à la vente." : "From idea to sale."}
          </p>
          <h1 className="homeHeroTitle" style={{ mixBlendMode: "normal" }}>BROTHERSTUDIO</h1>
          <div className="homeHeroValue">
            <p className="homeHeroValueText">
              {isFrench
                ? "Brother Studio est une agence de marketing immobilier qui aide les promoteurs à lancer, commercialiser et vendre leurs projets grâce à l’image de marque, la 3D, les sites web, la publicité et la génération de prospects qualifiés."
                : "Brother Studio is a property marketing company that helps developers launch, commercialize and sell new real estate developments through branding, CGI, websites, advertising and qualified lead generation."}
            </p>
          </div>
          <div className="realEstateHeroActions homeHeroActions">
            <a className="realEstateHeroActionSecondary realEstateHeroActionNeon homeHeroActionNeon" href="#home-capabilities-title">Commercialiser mon projet <span aria-hidden="true">↗</span></a>
            <Link className="homeHeroDiscoverButton" href={withLocalePath(locale, "/immobilier/biens")}>
              {isFrench ? "Voir nos biens" : "View our properties"} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
