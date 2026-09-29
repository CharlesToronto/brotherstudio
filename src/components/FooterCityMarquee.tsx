"use client";

import { useEffect, useState } from "react";

const swissRomandyCities = [
  "Lausanne",
  "Montreux",
  "Vevey",
  "Nyon",
  "Morges",
  "Yverdon-les-Bains",
  "Gland",
  "Rolle",
  "Aigle",
  "Sion",
  "Sierre",
  "Martigny",
  "Monthey",
  "Fully",
  "Conthey",
  "Crans-Montana",
  "Verbier",
];

export function FooterCityMarquee({ className = "" }: { className?: string }) {
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current === 0 ? 1 : 0));
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      className={`siteFooterCityMarquee ${className}`.trim()}
      aria-label="Villes desservies et informations BrotherStudio"
    >
      <div className="siteFooterCityMarqueeViewport">
        <div
          className="siteFooterCityMarqueeSlides"
          data-active-slide={activeSlide}
        >
          <div className="siteFooterCityMarqueeSlide" aria-hidden={activeSlide !== 0}>
            <div className="siteFooterCityMarqueeTrack">
              {swissRomandyCities.map((city) => (
                <span key={city} className="siteFooterCityMarqueeItem">
                  {city}
                </span>
              ))}
              {swissRomandyCities.map((city, index) => (
                <span
                  key={`${city}-duplicate-${index}`}
                  className="siteFooterCityMarqueeItem siteFooterCityMarqueeItemDuplicate"
                  aria-hidden="true"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
          <div className="siteFooterCityMarqueeSlide siteFooterCityMarqueeStats" aria-hidden={activeSlide !== 1}>
            <span><strong className="siteFooterCityMarqueeStatNumber">+50</strong> projets réalisés en Suisse</span>
            <span className="siteFooterCityMarqueeDivider">|</span>
            <span><strong className="siteFooterCityMarqueeStatNumber">+15</strong> clients réguliers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
