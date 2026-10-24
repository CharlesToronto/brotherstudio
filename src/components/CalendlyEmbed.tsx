"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

import { trackMeta } from "@/lib/metaPixel";
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

  useEffect(() => {
    const scheduled = new Set<string>();
    function onMessage(event: MessageEvent) {
      const frame = containerRef.current?.querySelector("iframe");
      if (event.origin !== "https://calendly.com" || !frame || event.source !== frame.contentWindow) return;
      if (event.data?.event !== "calendly.event_scheduled") return;
      const uri = event.data?.payload?.event?.uri;
      if (typeof uri !== "string" || scheduled.has(uri)) return;
      scheduled.add(uri);
      trackMeta("Schedule", { booking_provider: "calendly" });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://assets.calendly.com" />
      <link rel="preconnect" href="https://calendly.com" />
      <link
        href="https://assets.calendly.com/assets/external/widget.css"
        rel="stylesheet"
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
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
