"use client";

type SceneFilterOption<T extends string> = {
  key: T;
  label: string;
};

type HomeSceneFiltersProps<T extends string> = {
  activeFilter: T;
  ariaLabel: string;
  filters: readonly SceneFilterOption<T>[];
  onFilterChange: (filter: T) => void;
};

export function HomeSceneFilters<T extends string>({
  activeFilter,
  ariaLabel,
  filters,
  onFilterChange,
}: HomeSceneFiltersProps<T>) {
  return (
    <section className="homeSceneFilters" aria-label={ariaLabel}>
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          className="homeSceneFilterButton"
          data-active={activeFilter === filter.key}
          onClick={() => onFilterChange(filter.key)}
        >
          {filter.label}
        </button>
      ))}
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
