"use client";

import { Dongle } from "next/font/google";
import { ArrowDown } from "lucide-react";

import { useHeroScrollBridge } from "@/hooks/useHeroScrollBridge";

const dongle = Dongle({
  subsets: ["latin"],
  weight: ["300"],
});

export function HomeVideoHero() {
  const heroScrollBridgeRef = useHeroScrollBridge<HTMLElement>();

  return (
    <section
      ref={heroScrollBridgeRef}
      className="homeBlurWordSection"
      aria-label="BrotherStudio video hero"
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
