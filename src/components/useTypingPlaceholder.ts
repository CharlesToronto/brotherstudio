"use client";

import { useEffect, useState } from "react";

export function useTypingPlaceholder(target: string, enabled = true) {
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      const cycle = target.length + 18;
      const position = frame % cycle;
      const sliceLength = position <= target.length ? position : target.length;

      setAnimatedPlaceholder(target.slice(0, sliceLength));
      frame += 1;
      timeoutId = setTimeout(tick, position < target.length ? 65 : 95);
    };

    tick();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, target]);

  return enabled ? animatedPlaceholder : target;
}
