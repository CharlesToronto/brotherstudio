"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";
import { useAnimationFrame } from "motion/react";

import { useMousePositionRef } from "@/hooks/use-mouse-position-ref";
import { cn } from "@/lib/utils";

interface FloatingContextType {
  registerElement: (id: string, element: HTMLDivElement, depth: number) => void;
  unregisterElement: (id: string) => void;
}

const FloatingContext = createContext<FloatingContextType | null>(null);

interface FloatingProps {
  children: ReactNode;
  className?: string;
  sensitivity?: number;
  easingFactor?: number;
}

const Floating = ({
  children,
  className,
  sensitivity = 1,
  easingFactor = 0.05,
}: FloatingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsMap = useRef(
    new Map<
      string,
      {
        element: HTMLDivElement;
        depth: number;
        currentPosition: { x: number; y: number };
      }
    >(),
  );
  const mousePositionRef = useMousePositionRef(containerRef);

  const registerElement = useCallback(
    (id: string, element: HTMLDivElement, depth: number) => {
      elementsMap.current.set(id, {
        element,
        depth,
        currentPosition: { x: 0, y: 0 },
      });
    },
    [],
  );

  const unregisterElement = useCallback((id: string) => {
    elementsMap.current.delete(id);
  }, []);

  useAnimationFrame(() => {
    if (!containerRef.current) return;

    elementsMap.current.forEach((data) => {
      const strength = (data.depth * sensitivity) / 20;
      const targetX = mousePositionRef.current.x * strength;
      const targetY = mousePositionRef.current.y * strength;
      const dx = targetX - data.currentPosition.x;
      const dy = targetY - data.currentPosition.y;

      data.currentPosition.x += dx * easingFactor;
      data.currentPosition.y += dy * easingFactor;
      data.element.style.transform = `translate3d(${data.currentPosition.x}px, ${data.currentPosition.y}px, 0)`;
    });
  });

  return (
    <FloatingContext.Provider value={{ registerElement, unregisterElement }}>
      <div ref={containerRef} className={cn("parallaxFloatingRoot", className)}>
        {children}
      </div>
    </FloatingContext.Provider>
  );
};

export default Floating;

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  depth?: number;
}

export const FloatingElement = ({
  children,
  className,
  depth = 1,
}: FloatingElementProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const elementId = useId();
  const context = useContext(FloatingContext);

  useEffect(() => {
    if (!elementRef.current || !context) return;

    context.registerElement(elementId, elementRef.current, depth ?? 0.01);
    return () => context.unregisterElement(elementId);
  }, [context, depth, elementId]);

  return (
    <div ref={elementRef} className={cn("parallaxFloatingElement", className)}>
      {children}
    </div>
  );
};
