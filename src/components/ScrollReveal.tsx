"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";

type ScrollRevealProps = {
  as?: keyof React.JSX.IntrinsicElements;
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  style?: CSSProperties;
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
};

export function ScrollReveal({
  as = "div",
  children,
  className,
  delay = 0,
  threshold = 0.14,
  rootMargin = "0px 0px -10% 0px",
  style,
  ...rest
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      node.setAttribute("data-revealed", "true");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        node.setAttribute("data-revealed", entry.isIntersecting ? "true" : "false");
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  const props = {
    ...rest,
    ref: ref as never,
    className: ["scrollReveal", className].filter(Boolean).join(" "),
    "data-revealed": "false" as const,
    style: {
      ...style,
      "--reveal-delay": `${delay}ms`,
    } as CSSProperties,
  };

  switch (as) {
    case "main":
      return <main {...props}>{children}</main>;
    case "section":
      return <section {...props}>{children}</section>;
    case "article":
      return <article {...props}>{children}</article>;
    case "figure":
      return <figure {...props}>{children}</figure>;
    case "header":
      return <header {...props}>{children}</header>;
    case "h2":
      return <h2 {...props}>{children}</h2>;
    case "p":
      return <p {...props}>{children}</p>;
    default:
      return <div {...props}>{children}</div>;
  }
}
