"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

import { buildCalendlyEmbedUrl } from "@/lib/calendly";

type CalendlyEmbedProps = {
  title: string;
  url: string;
};

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        resize?: boolean;
      }) => void;
    };
  }
}

export function CalendlyEmbed({ title, url }: CalendlyEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const embedUrl = buildCalendlyEmbedUrl(url);

  useEffect(() => {
    if (!isScriptReady || !window.Calendly || !containerRef.current) return;

    containerRef.current.innerHTML = "";
    window.Calendly.initInlineWidget({
      url: embedUrl,
      parentElement: containerRef.current,
      resize: true,
    });
  }, [embedUrl, isScriptReady]);

  return (
    <>
      <link
        href="https://assets.calendly.com/assets/external/widget.css"
        rel="stylesheet"
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={() => setIsScriptReady(true)}
      />
      <div className="calendlyCard">
        <div
          ref={containerRef}
          className="calendlyInlineWidget"
          aria-label={title}
        />
      </div>
    </>
  );
}
