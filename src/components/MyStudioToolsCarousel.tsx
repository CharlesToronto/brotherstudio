"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type MyStudioTool = {
  name: string;
  description: string;
  href: string;
  external?: boolean;
  visual: "review" | "fileflow" | "wallis";
};

function ToolVisual({ type }: { type: MyStudioTool["visual"] }) {
  if (type === "review") {
    return (
      <div className="myStudioVisual myStudioVisualReview">
        <Image
          src="/myreview-cover-v2.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 32vw"
        />
      </div>
    );
  }

  if (type === "fileflow") {
    return (
      <div className="myStudioVisual myStudioVisualFileflow" aria-hidden="true">
        <Image
          src="/fileflow-cover.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 32vw"
        />
      </div>
    );
  }

  return (
    <div className="myStudioVisual myStudioVisualWallis" aria-hidden="true">
      <Image
        src="/mywallis-cover.webp"
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 32vw"
      />
    </div>
  );
}

export function MyStudioToolsCarousel({
  tools,
  isFrench,
}: {
  tools: MyStudioTool[];
  isFrench: boolean;
}) {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let frame = 0;
    const updateActiveIndex = () => {
      const cards = Array.from(carousel.children) as HTMLElement[];
      if (cards.length === 0) return;

      const carouselCenter = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - carouselCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
    };

    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveIndex);
    };

    updateActiveIndex();
    carousel.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    return () => {
      cancelAnimationFrame(frame);
      carousel.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, [tools.length]);

  const scrollToCard = (index: number) => {
    const carousel = carouselRef.current;
    const card = carousel?.children[index] as HTMLElement | undefined;
    if (!carousel || !card) return;

    carousel.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    setActiveIndex(index);
  };

  return (
    <div className="myStudioCarousel">
      <div className="myStudioCarouselIndicators" role="tablist" aria-label="Outil actif">
        {tools.map((tool, index) => (
          <button
            key={tool.name}
            type="button"
            role="tab"
            aria-label={`${isFrench ? "Afficher" : "Show"} ${tool.name}`}
            aria-selected={activeIndex === index}
            className="myStudioCarouselIndicator"
            data-active={activeIndex === index ? "true" : "false"}
            onClick={() => scrollToCard(index)}
          />
        ))}
      </div>

      <div ref={carouselRef} className="myStudioGrid">
        {tools.map((tool) => {
          const card = (
            <>
              <ToolVisual type={tool.visual} />
              <div className="myStudioCardContent">
                <div>
                  <h2>{tool.name}</h2>
                  <p>{tool.description}</p>
                </div>
                <span className="myStudioDiscover">
                  {isFrench ? "Découvrir" : "Discover"}
                </span>
              </div>
            </>
          );

          return tool.external ? (
            <a
              key={tool.name}
              className="myStudioCard"
              href={tool.href}
              target="_blank"
              rel="noreferrer"
            >
              {card}
            </a>
          ) : (
            <Link key={tool.name} className="myStudioCard" href={tool.href}>
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
