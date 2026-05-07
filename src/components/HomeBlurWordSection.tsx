"use client";

import type { CSSProperties } from "react";
import { Dongle } from "next/font/google";
import { useState } from "react";

const INITIAL_CURSOR = { x: 50, y: 50, active: false, jitterX: 0, jitterY: 0 };

const dongle = Dongle({
  subsets: ["latin"],
  weight: ["300"],
});

export function HomeBlurWordSection() {
  const [cursor, setCursor] = useState(INITIAL_CURSOR);

  return (
    <section
      className="homeBlurWordSection"
      aria-label="BrotherStudio hero typography"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
        const energy = Math.min(distance / Math.max(rect.width, rect.height), 0.62);
        const jitterX = (Math.random() - 0.5) * 32 * energy;
        const jitterY = (Math.random() - 0.5) * 26 * energy;
        setCursor({ x, y, active: true, jitterX, jitterY });
      }}
      onPointerLeave={() => setCursor(INITIAL_CURSOR)}
      style={
        {
          "--cursor-x": `${cursor.x}%`,
          "--cursor-y": `${cursor.y}%`,
          "--cursor-opacity": cursor.active ? 1 : 0,
          "--cursor-jitter-x": `${cursor.jitterX}px`,
          "--cursor-jitter-y": `${cursor.jitterY}px`,
        } as CSSProperties
      }
    >
      <div className={`homeBlurWordStage ${dongle.className}`}>
        <span className="homeBlurWord homeBlurWordBase">BROTHERSTUDIO</span>
        <span className="homeBlurWord homeBlurWordReveal">BROTHERSTUDIO</span>
      </div>
    </section>
  );
}
