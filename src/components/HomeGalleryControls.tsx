"use client";

import {
  Bath,
  BedDouble,
  CookingPot,
  LayoutGrid,
  Sofa,
  Sparkles,
  Trees,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

type SceneFilterOption<T extends string> = {
  key: T;
  label: string;
};

type GalleryPrimaryTabOption<T extends string> = {
  key: T;
  label: string;
};

type HomeGalleryPrimaryTabsProps<T extends string> = {
  activeTab: T;
  ariaLabel: string;
  tabs: readonly GalleryPrimaryTabOption<T>[];
  onTabChange: (tab: T) => void;
};

export function HomeGalleryPrimaryTabs<T extends string>({
  activeTab,
  ariaLabel,
  tabs,
  onTabChange,
}: HomeGalleryPrimaryTabsProps<T>) {
  return (
    <section className="homeGalleryPrimaryTabs" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className="homeGalleryPrimaryTabButton"
          data-active={activeTab === tab.key}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </section>
  );
}

type HomeSceneFiltersProps<T extends string> = {
  activeFilter: T;
  ariaLabel: string;
  filters: readonly SceneFilterOption<T>[];
  onFilterChange: (filter: T) => void;
};

const sceneFilterIcons: Record<string, LucideIcon> = {
  all: LayoutGrid,
  bedroom: BedDouble,
  "living-room": Sofa,
  kitchen: CookingPot,
  exterior: Trees,
  bathroom: Bath,
  "focus-ambiance": Sparkles,
};

const sceneFilterGradients: Record<string, { from: string; to: string }> = {
  all: { from: "#a955ff", to: "#ea51ff" },
  bedroom: { from: "#56ccf2", to: "#2f80ed" },
  "living-room": { from: "#ff9966", to: "#ff5e62" },
  kitchen: { from: "#80ff72", to: "#7ee8fa" },
  exterior: { from: "#3bb78f", to: "#0bab64" },
  bathroom: { from: "#7f7fd5", to: "#86a8e7" },
  "focus-ambiance": { from: "#ffa9c6", to: "#f434e2" },
};

type SceneFilterStyle = CSSProperties & {
  "--gradient-from": string;
  "--gradient-to": string;
};

export function HomeSceneFilters<T extends string>({
  activeFilter,
  ariaLabel,
  filters,
  onFilterChange,
}: HomeSceneFiltersProps<T>) {
  return (
    <section className="homeSceneFilters" aria-label={ariaLabel}>
      <div className="homeSceneFiltersTrack">
        {filters.map((filter) => {
          const Icon = sceneFilterIcons[filter.key] ?? LayoutGrid;
          const gradient = sceneFilterGradients[filter.key] ?? sceneFilterGradients.all;
          const style: SceneFilterStyle = {
            "--gradient-from": gradient.from,
            "--gradient-to": gradient.to,
          };

          return (
            <button
              key={filter.key}
              type="button"
              className="homeSceneFilterButton"
              data-active={activeFilter === filter.key}
              aria-label={filter.label}
              title={filter.label}
              style={style}
              onClick={() => onFilterChange(filter.key)}
            >
              <span className="homeSceneFilterGlow" aria-hidden="true" />
              <span className="homeSceneFilterGradient" aria-hidden="true" />
              <span className="homeSceneFilterIcon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <span className="homeSceneFilterLabel">{filter.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type MobileDisplayMode = "projects" | "grid";

export function HomeMobileDisplayFilters({
  activeMode,
  onModeChange,
}: {
  activeMode: MobileDisplayMode;
  onModeChange: (mode: MobileDisplayMode) => void;
}) {
  return (
    <div
      className="homeMobileDisplayFilters"
      role="toolbar"
      aria-label="Mobile gallery display"
    >
      <button
        type="button"
        className="homeMobileDisplayButton"
        data-active={activeMode === "grid"}
        onClick={() => onModeChange("grid")}
      >
        Grille
      </button>
      <button
        type="button"
        className="homeMobileDisplayButton"
        data-active={activeMode === "projects"}
        onClick={() => onModeChange("projects")}
      >
        Projets
      </button>
    </div>
  );
}
