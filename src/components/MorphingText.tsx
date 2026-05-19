"use client";

import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const MORPH_TIME = 1.5;
const COOLDOWN_TIME = 0.5;

function useMorphingText(texts: string[]) {
  const textIndexRef = useRef(0);
  const morphRef = useRef(0);
  const cooldownRef = useRef(COOLDOWN_TIME);
  const timeRef = useRef(new Date());

  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback(
    (fraction: number) => {
      const current1 = text1Ref.current;
      const current2 = text2Ref.current;

      if (!current1 || !current2 || texts.length === 0) {
        return;
      }

      const safeFraction = Math.max(fraction, 0.0001);
      const invertedFraction = Math.max(1 - fraction, 0.0001);

      current2.style.filter = `blur(${Math.min(8 / safeFraction - 8, 100)}px)`;
      current2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      current1.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
      current1.style.opacity = `${Math.pow(1 - fraction, 0.4) * 100}%`;

      current1.textContent = texts[textIndexRef.current % texts.length];
      current2.textContent = texts[(textIndexRef.current + 1) % texts.length];
    },
    [texts],
  );

  const doMorph = useCallback(() => {
    morphRef.current -= cooldownRef.current;
    cooldownRef.current = 0;

    let fraction = morphRef.current / MORPH_TIME;

    if (fraction > 1) {
      cooldownRef.current = COOLDOWN_TIME;
      fraction = 1;
    }

    setStyles(fraction);

    if (fraction === 1) {
      textIndexRef.current += 1;
    }
  }, [setStyles]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;

    const current1 = text1Ref.current;
    const current2 = text2Ref.current;

    if (!current1 || !current2) {
      return;
    }

    current2.style.filter = "none";
    current2.style.opacity = "100%";
    current1.style.filter = "none";
    current1.style.opacity = "0%";
  }, []);

  useEffect(() => {
    if (texts.length === 0) {
      return;
    }

    let animationFrameId = 0;

    const animate = () => {
      animationFrameId = window.requestAnimationFrame(animate);

      const newTime = new Date();
      const dt = (newTime.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current = newTime;

      cooldownRef.current -= dt;

      if (cooldownRef.current <= 0) {
        doMorph();
      } else {
        doCooldown();
      }
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [doCooldown, doMorph, texts.length]);

  return { text1Ref, text2Ref };
}

type MorphingTextProps = {
  className?: string;
  texts: string[];
};

function TextLayers({ texts }: Pick<MorphingTextProps, "texts">) {
  const { text1Ref, text2Ref } = useMorphingText(texts);

  return (
    <>
      <span className="myExperienceMorphingTextLayer" ref={text1Ref} />
      <span className="myExperienceMorphingTextLayer" ref={text2Ref} />
    </>
  );
}

function SvgFilters() {
  return (
    <svg className="myExperienceMorphingTextFilter" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="myexperience-threshold">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 255 -140"
          />
        </filter>
      </defs>
    </svg>
  );
}

export function MorphingText({ texts, className }: MorphingTextProps) {
  return (
    <div className={cn("myExperienceMorphingText", className)}>
      <TextLayers texts={texts} />
      <SvgFilters />
    </div>
  );
}
