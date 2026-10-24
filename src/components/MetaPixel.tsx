"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { isPublicTrackingPath, META_PIXEL_ID as PIXEL_ID, trackMeta } from "@/lib/metaPixel";

export function MetaPixel() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  const trackPageView = useCallback(() => {
    const fbq = (window as Window & { fbq?: unknown }).fbq;
    if (!fbq || !pathname || lastTrackedPath.current === pathname) return;
    if (!isPublicTrackingPath(pathname)) return;
    trackMeta("PageView");
    const route = pathname.replace(/^\/(fr|en)(?=\/|$)/, "");
    if (/^\/mywebsite\/(plantaz|maretset)$/.test(route) || /^\/immobilier\/[^/]+$/.test(route) && !["/immobilier/biens", "/immobilier/vendre", "/immobilier/commercialisation"].includes(route)) {
      trackMeta("ViewContent", { content_ids: [route], content_category: "real_estate" });
    }
    lastTrackedPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  useEffect(() => {
    const startedForms = new WeakSet<HTMLFormElement>();
    function onInput(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const form = target.closest<HTMLFormElement>("form[data-meta-form]");
      if (!form || startedForms.has(form) || target.getAttribute("name") === "website") return;
      startedForms.add(form);
      trackMeta("FormStart", { form_name: form.dataset.metaForm! }, undefined, true);
    }
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const galleryButton = event.target.closest(".galleryImageButton");
      const galleryItem = galleryButton?.closest<HTMLElement>("[data-gallery-id]");
      if (galleryItem?.dataset.galleryId) trackMeta("ViewContent", { content_ids: [galleryItem.dataset.galleryId], content_category: "portfolio" });
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.href);
      const channel = url.protocol === "tel:" ? "phone" : url.protocol === "mailto:" ? "email" : ["wa.me", "api.whatsapp.com"].includes(url.hostname) ? "whatsapp" : null;
      if (channel) trackMeta("ContactClick", { channel }, undefined, true);
      else if (url.hostname === "calendly.com" || url.hash === "#booking") trackMeta("BookingClick", {}, undefined, true);
      else if (url.hash === "#contact") trackMeta("ContactFormClick", {}, undefined, true);
      else if (anchor.hasAttribute("download") || /\.pdf$/i.test(url.pathname)) trackMeta("DownloadClick", {}, undefined, true);
    }
    document.addEventListener("input", onInput);
    document.addEventListener("change", onInput);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("input", onInput);
      document.removeEventListener("change", onInput);
      document.removeEventListener("click", onClick);
    };
  }, []);

  if (!pathname || !isPublicTrackingPath(pathname)) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive" onReady={trackPageView}>
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');`}
      </Script>
      <noscript>
        {/* Meta's tracking beacon must remain a plain image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
