"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    const path = pathname || "/";
    if (lastTrackedPathRef.current === path) return;
    lastTrackedPathRef.current = path;

    const payload = JSON.stringify({ path });

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/hit", blob);
      return;
    }

    void fetch("/api/analytics/hit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
