"use client";

import { useState } from "react";

type PackageTier = "classic" | "premium" | "other";

type PricePackage = {
  name: string;
  price: string;
  comparePrice?: string;
  details?: string[];
  tier?: PackageTier;
};

type PricePackagesSectionProps = {
  title: string;
  titleId: string;
  packages: PricePackage[];
  tabLabels: {
    ariaLabel: string;
    classic: string;
    premium: string;
  };
};

export function PricePackagesSection({
  title,
  titleId,
  packages,
  tabLabels,
}: PricePackagesSectionProps) {
  const [activeTier, setActiveTier] = useState<PackageTier>("classic");

  const visiblePackages = packages.filter((item) => item.tier === activeTier);

  return (
    <section className="servicesSection packageSection" aria-labelledby={titleId}>
      <h2 id={titleId} className="servicesTitle packageSectionTitle">
        {title}
      </h2>

      <div className="packageTierToggle" role="tablist" aria-label={tabLabels.ariaLabel}>
        <button
          className="packageTierToggleButton"
          type="button"
          role="tab"
          aria-selected={activeTier === "classic"}
          data-active={activeTier === "classic"}
          onClick={() => setActiveTier("classic")}
        >
          {tabLabels.classic}
        </button>
        <button
          className="packageTierToggleButton"
          type="button"
          role="tab"
          aria-selected={activeTier === "premium"}
          data-active={activeTier === "premium"}
          onClick={() => setActiveTier("premium")}
        >
          {tabLabels.premium}
        </button>
      </div>

      <ul className="servicesList" aria-label={title}>
        {visiblePackages.map((item) => (
          <li key={item.name} className="servicesItem">
            <div className="servicesItemPriceRow packagePriceRow">
              <span aria-hidden="true" />
              <span className="servicesItemPriceStack">
                {item.comparePrice ? (
                  <span className="servicesItemComparePrice">({item.comparePrice}) </span>
                ) : null}
                <span className="servicesItemPriceValue">{item.price}</span>
              </span>
            </div>
            {item.details?.length ? (
              <ul className="servicesNestedList" aria-label={item.name}>
                {item.details.map((detail) => (
                  <li key={`${item.name}-${detail}`} className="servicesNestedItem">
                    {detail}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
