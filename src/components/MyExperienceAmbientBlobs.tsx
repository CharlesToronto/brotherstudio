"use client";

import { motion, useReducedMotion } from "motion/react";

type BlobConfig = {
  top: number;
  left: number;
  size: number;
  minSize: number;
  inner: string;
  mid: string;
  x1: string;
  x2: string;
  y1: string;
  y2: string;
  s1: number;
  s2: number;
  o1: number;
  o2: number;
  o3: number;
  duration: number;
  delay: number;
};

const PALETTES = [
  { inner: "rgb(168 85 247 / 0.34)", mid: "rgb(109 40 217 / 0.14)" },
  { inner: "rgb(236 72 153 / 0.28)", mid: "rgb(190 24 93 / 0.12)" },
  { inner: "rgb(244 114 182 / 0.24)", mid: "rgb(168 85 247 / 0.1)" },
  { inner: "rgb(217 70 239 / 0.24)", mid: "rgb(126 34 206 / 0.1)" },
];

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random: () => number, min: number, max: number) {
  return min + random() * (max - min);
}

const BLOBS: BlobConfig[] = Array.from({ length: 6 }, (_, index) => {
  const random = createSeededRandom(2048 + index * 97);
  const palette = PALETTES[index % PALETTES.length];

  return {
    top: randomBetween(random, -8, 72),
    left: randomBetween(random, -10, 76),
    size: randomBetween(random, 24, 42),
    minSize: randomBetween(random, 260, 420),
    inner: palette.inner,
    mid: palette.mid,
    x1: `${randomBetween(random, -10, 14)}vw`,
    x2: `${randomBetween(random, -14, 16)}vw`,
    y1: `${randomBetween(random, -10, 12)}vh`,
    y2: `${randomBetween(random, -12, 14)}vh`,
    s1: randomBetween(random, 0.92, 1.12),
    s2: randomBetween(random, 0.88, 1.16),
    o1: randomBetween(random, 0.18, 0.28),
    o2: randomBetween(random, 0.24, 0.38),
    o3: randomBetween(random, 0.16, 0.3),
    duration: randomBetween(random, 18, 34),
    delay: randomBetween(random, 0, 6),
  };
});

export function MyExperienceAmbientBlobs() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="myExperienceAmbient" aria-hidden="true">
      {BLOBS.map((blob, index) => (
        <motion.span
          key={`${blob.top}-${blob.left}-${index}`}
          className="myExperienceAmbientSpot"
          style={{
            top: `${blob.top}%`,
            left: `${blob.left}%`,
            width: `${blob.size}vw`,
            height: `${blob.size}vw`,
            minWidth: `${blob.minSize}px`,
            minHeight: `${blob.minSize}px`,
            background: `radial-gradient(circle at 35% 35%, ${blob.inner} 0%, ${blob.mid} 42%, transparent 74%)`,
          }}
          initial={{
            opacity: blob.o1,
            x: 0,
            y: 0,
            scale: 1,
          }}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  x: [0, blob.x1, blob.x2, 0],
                  y: [0, blob.y1, blob.y2, 0],
                  scale: [1, blob.s1, blob.s2, 1],
                  opacity: [blob.o1, blob.o2, blob.o3, blob.o1],
                }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: blob.duration,
                  delay: blob.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}
