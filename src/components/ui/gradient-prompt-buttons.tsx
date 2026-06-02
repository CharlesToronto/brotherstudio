"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type GradientPromptButtonItem = {
  label: string;
  icon: ReactNode;
  gradientFrom: string;
  gradientTo: string;
  onClick: () => void;
};

type GradientPromptButtonsProps = {
  items: GradientPromptButtonItem[];
  className?: string;
};

type GradientStyle = CSSProperties & {
  "--gradient-from": string;
  "--gradient-to": string;
};

export function GradientPromptButtons({
  items,
  className,
}: GradientPromptButtonsProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      {items.map((item) => {
        const style: GradientStyle = {
          "--gradient-from": item.gradientFrom,
          "--gradient-to": item.gradientTo,
        };

        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            style={style}
            className={cn(
              "group relative inline-flex h-[58px] w-[58px] items-center justify-center overflow-visible rounded-full bg-white",
              "shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all duration-500 ease-out hover:w-[210px] hover:shadow-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
            )}
          >
            <span className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500 group-hover:opacity-100" />
            <span className="absolute inset-x-2 top-3 -z-10 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 blur-[18px] transition-all duration-500 group-hover:opacity-45" />

            <span className="relative z-10 flex items-center justify-center text-stone-500 transition-all duration-500 group-hover:scale-0 group-hover:opacity-0">
              {item.icon}
            </span>

            <span className="absolute z-10 scale-75 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
