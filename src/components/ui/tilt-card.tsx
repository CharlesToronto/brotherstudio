"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const SPRING_MOUSE = {
  stiffness: 200,
  damping: 15,
  mass: 0.3,
} as const;

function useHoverCapable() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return canHover;
}

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
  role?: string;
};

export function TiltCard({
  children,
  className,
  max = 10,
  glare = true,
  role,
}: TiltCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const canHover = useHoverCapable();
  const enabled = !reduceMotion && canHover;

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springX = useSpring(rotateX, SPRING_MOUSE);
  const springY = useSpring(rotateY, SPRING_MOUSE);

  const transform = useMotionTemplate`perspective(1000px) rotateX(${springX}deg) rotateY(${springY}deg)`;
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.5), rgb(255 255 255 / 0.16) 22%, transparent 56%)`;

  return (
    <motion.article
      ref={ref}
      role={role}
      className={className}
      style={{ transform, transformStyle: "preserve-3d" }}
      onMouseMove={(event) => {
        const element = ref.current;
        if (!element || !enabled) return;

        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        rotateY.set((x - 0.5) * max);
        rotateX.set((0.5 - y) * max);
        glareX.set(x * 100);
        glareY.set(y * 100);
      }}
      onMouseLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      {children}
      {glare && enabled ? (
        <motion.span
          aria-hidden="true"
          className="tiltCardGlare"
          style={{ background: glareBackground }}
        />
      ) : null}
    </motion.article>
  );
}
