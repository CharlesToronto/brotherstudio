"use client";

import { useState } from "react";

import { PricePackagesSection } from "@/components/PricePackagesSection";

type PriceService = {
  name: string;
  price?: string;
  options?: Array<{
    name: string;
    price?: string;
  }>;
};

type PricePackage = {
  name: string;
  price: string;
  comparePrice?: string;
  period?: string;
  badge?: string;
  summary?: string;
  featured?: boolean;
  sections?: Array<{
    title: string;
    items: string[];
  }>;
  included?: string[];
  delivery?: string[];
  note?: string;
};

type PriceOfferTabsProps = {
  packagesTitle: string;
  packagesTitleId: string;
  packages: PricePackage[];
  includedLabel: string;
  deliveryLabel: string;
  classicLabel: string;
  classicTitleId: string;
  imageTitle: string;
  imageNote: string;
  images: PriceService[];
  videoTitle: string;
  videos: PriceService[];
  walkthroughTitle: string;
  walkthroughs: PriceService[];
  websiteTitle: string;
  websites: PriceService[];
  adsTitle: string;
  ads: PriceService[];
};

function PriceListSection({
  title,
  titleId,
  items,
  note,
}: {
  title: string;
  titleId: string;
  items: PriceService[];
  note?: string;
}) {
  return (
    <section className="servicesSection classicPriceSection" aria-labelledby={titleId}>
      <h2 id={titleId} className="servicesTitle contactAccent">
        {title}
      </h2>
      <ul className="servicesList" aria-label={title}>
        {items.map((item) => (
          <li key={item.name} className="servicesItem">
            <div className="servicesItemPriceRow">
              <span>{item.name}</span>
              {item.price ? <span className="servicesItemPriceValue">{item.price}</span> : null}
            </div>
            {item.options?.length ? (
              <ul className="servicesNestedList" aria-label={item.name}>
                {item.options.map((option) => (
                  <li
                    key={`${item.name}-${option.name}`}
                    className="servicesNestedItem servicesItemPriceRow"
                  >
                    <span>{option.name}</span>
                    {option.price ? (
                      <span className="servicesItemPriceValue">{option.price}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
      {note ? <p className="servicesNote">{note}</p> : null}
    </section>
  );
}

export function PriceOfferTabs({
  packagesTitle,
  packagesTitleId,
  packages,
  includedLabel,
  deliveryLabel,
  classicLabel,
  classicTitleId,
  imageTitle,
  imageNote,
  images,
  videoTitle,
  videos,
  walkthroughTitle,
  walkthroughs,
  websiteTitle,
  websites,
  adsTitle,
  ads,
}: PriceOfferTabsProps) {
  const [activeTab, setActiveTab] = useState<"packages" | "classic">("packages");

  return (
    <section className="priceOfferTabsShell" aria-labelledby={packagesTitleId}>
      <div className="priceOfferTabs" role="tablist" aria-label={packagesTitle}>
        <button
          className="priceOfferTab"
          type="button"
          role="tab"
          aria-selected={activeTab === "packages"}
          data-active={activeTab === "packages" ? "true" : "false"}
          onClick={() => setActiveTab("packages")}
        >
          Package
        </button>
        <button
          className="priceOfferTab"
          type="button"
          role="tab"
          aria-selected={activeTab === "classic"}
          data-active={activeTab === "classic" ? "true" : "false"}
          onClick={() => setActiveTab("classic")}
        >
          {classicLabel}
        </button>
      </div>

      {activeTab === "packages" ? (
        <PricePackagesSection
          title={packagesTitle}
          titleId={packagesTitleId}
          packages={packages}
          includedLabel={includedLabel}
          deliveryLabel={deliveryLabel}
        />
      ) : (
        <div className="classicPricePanel" id={classicTitleId}>
          <PriceListSection
            title={imageTitle}
            titleId={`${classicTitleId}Images`}
            items={images}
            note={imageNote}
          />
          <PriceListSection title={videoTitle} titleId={`${classicTitleId}Videos`} items={videos} />
          {walkthroughs.length ? (
            <PriceListSection
              title={walkthroughTitle}
              titleId={`${classicTitleId}Walkthrough`}
              items={walkthroughs}
            />
          ) : null}
          <PriceListSection title={websiteTitle} titleId={`${classicTitleId}Website`} items={websites} />
          <PriceListSection title={adsTitle} titleId={`${classicTitleId}Ads`} items={ads} />
        </div>
      )}
    </section>
  );
}
