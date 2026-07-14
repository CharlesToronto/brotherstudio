"use client";

import { useEffect, useRef, useState } from "react";

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

type NormalizedSection = {
  title: string;
  itemCount: number;
};

type PricePackagesSectionProps = {
  title: string;
  titleId: string;
  packages: PricePackage[];
  includedLabel: string;
  deliveryLabel: string;
};

export function PricePackagesSection({
  title,
  titleId,
  packages,
  includedLabel,
  deliveryLabel,
}: PricePackagesSectionProps) {
  const missingValue = "-";
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [areDetailsExpanded, setAreDetailsExpanded] = useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);

  const openAssistant = () => {
    window.dispatchEvent(new Event("site-assistant:open"));
  };

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, packages.length);
  }, [packages.length]);

  const splitPriceLabel = (price: string) => {
    if (price.startsWith("From ")) {
      return { prefix: "From", amount: price.slice(5) };
    }

    if (price.startsWith("Des ")) {
      return { prefix: "Des", amount: price.slice(4) };
    }

    return { prefix: null, amount: price };
  };

  const normalizedSections = packages.reduce<NormalizedSection[]>((sections, item) => {
    item.sections?.forEach((section) => {
      const existingSection = sections.find((current) => current.title === section.title);

      if (existingSection) {
        existingSection.itemCount = Math.max(existingSection.itemCount, section.items.length);
        return;
      }

      sections.push({
        title: section.title,
        itemCount: section.items.length,
      });
    });

    return sections;
  }, []);

  const normalizedIncludedCount = packages.reduce(
    (maxCount, item) => Math.max(maxCount, item.included?.length ?? 0),
    0,
  );

  const normalizedDeliveryCount = packages.reduce(
    (maxCount, item) => Math.max(maxCount, item.delivery?.length ?? 0),
    0,
  );

  const togglePackageDetails = () => {
    setAreDetailsExpanded((current) => !current);
  };

  const scrollToPackage = (index: number) => {
    const container = carouselRef.current;
    const card = cardRefs.current[index];
    if (!container || !card) return;

    const targetLeft =
      card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;

    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });

    setActiveMobileIndex(index);
  };

  const showPreviousPackage = () => {
    const previousIndex = activeMobileIndex === 0 ? packages.length - 1 : activeMobileIndex - 1;
    scrollToPackage(previousIndex);
  };

  const showNextPackage = () => {
    const nextIndex = activeMobileIndex === packages.length - 1 ? 0 : activeMobileIndex + 1;
    scrollToPackage(nextIndex);
  };

  const handleCarouselScroll = () => {
    const container = carouselRef.current;
    if (!container) return;

    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveMobileIndex(closestIndex);
  };

  return (
    <section className="servicesSection packagePlansSection" aria-labelledby={titleId}>
      <h2 id={titleId} className="visuallyHidden">
        {title}
      </h2>

      <div className="packagePlansDots" aria-label="Package navigation">
        <div className="packagePlansMobileHint">
          <button
            type="button"
            className="packagePlansArrow"
            aria-label="Offre precedente"
            onClick={showPreviousPackage}
          >
            ‹
          </button>
          <span>Faites defiler</span>
          <button
            type="button"
            className="packagePlansArrow"
            aria-label="Offre suivante"
            onClick={showNextPackage}
          >
            ›
          </button>
        </div>
        <div className="packagePlansDotsRow">
          {packages.map((item, index) => (
            <button
              key={`${item.name}-dot`}
              type="button"
              className="packagePlansDot"
              data-active={activeMobileIndex === index ? "true" : "false"}
              aria-label={item.name}
              aria-pressed={activeMobileIndex === index}
              onClick={() => scrollToPackage(index)}
            />
          ))}
        </div>
      </div>

      <div
        ref={carouselRef}
        className="packagePlansGrid"
        onScroll={handleCarouselScroll}
      >
        {packages.map((item, index) => {
          const { prefix, amount } = splitPriceLabel(item.price);
          const isExpanded = areDetailsExpanded;

          return (
            <article
              key={item.name}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className="packagePlanCard"
              data-featured={item.featured ? "true" : "false"}
            >
              <header className="packagePlanHeader">
                <h3 className="packagePlanTitle">{item.name}</h3>
                {item.summary ? <p className="packagePlanSummary">{item.summary}</p> : null}
                <div className="packagePlanPriceBlock">
                  <span
                    className="packagePlanPricePrefix"
                    data-empty={prefix ? "false" : "true"}
                  >
                    {prefix ?? " "}
                  </span>
                  <div className="packagePlanPriceRow">
                    <strong className="packagePlanPrice">{amount}</strong>
                  </div>
                </div>
              </header>
              <div className="packagePlanDivider" aria-hidden="true" />

              {normalizedIncludedCount > 0 ? (
                <section className="packagePlanSection packagePlanSectionAccent">
                  <h4 className="packagePlanSectionTitle">{includedLabel}</h4>
                  <ul className="packagePlanList">
                    {Array.from({ length: normalizedIncludedCount }, (_, index) => {
                      const detail = item.included?.[index];
                      const hasDetail = Boolean(detail && detail !== missingValue);
                      const rowKey = `included:${index}`;

                      return (
                      <li
                        key={`included-${index}`}
                        className="packagePlanListItem"
                        data-highlighted={highlightedRow === rowKey ? "true" : "false"}
                        data-missing={hasDetail ? "false" : "true"}
                        onBlur={() => setHighlightedRow(null)}
                        onFocus={() => setHighlightedRow(rowKey)}
                        onMouseEnter={() => setHighlightedRow(rowKey)}
                        onMouseLeave={() => setHighlightedRow(null)}
                        tabIndex={0}
                      >
                        {hasDetail ? detail : missingValue}
                      </li>
                      );
                    })}
                  </ul>
                  <button
                    className="packagePlanToggle"
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={togglePackageDetails}
                  >
                    {isExpanded ? "Refermer les details" : "Tous les details"}
                  </button>
                </section>
              ) : null}

              {isExpanded && normalizedSections.length ? (
                <div className="packagePlanSections">
                  {normalizedSections.map((section) => {
                    const packageSection = item.sections?.find(
                      (current) => current.title === section.title,
                    );

                    return (
                    <section key={`${item.name}-${section.title}`} className="packagePlanSection">
                      <div className="packagePlanSectionDivider" aria-hidden="true" />
                      <h4 className="packagePlanSectionTitle">{section.title}</h4>
                      <ul className="packagePlanList">
                        {Array.from({ length: section.itemCount }, (_, index) => {
                          const detail = packageSection?.items[index];
                          const hasDetail = Boolean(detail && detail !== missingValue);
                          const rowKey = `section:${section.title}:${index}`;

                          return (
                          <li
                            key={`${section.title}-${index}`}
                            className="packagePlanListItem"
                            data-highlighted={highlightedRow === rowKey ? "true" : "false"}
                            data-missing={hasDetail ? "false" : "true"}
                            onBlur={() => setHighlightedRow(null)}
                            onFocus={() => setHighlightedRow(rowKey)}
                            onMouseEnter={() => setHighlightedRow(rowKey)}
                            onMouseLeave={() => setHighlightedRow(null)}
                            tabIndex={0}
                          >
                            {hasDetail ? detail : missingValue}
                          </li>
                          );
                        })}
                      </ul>
                    </section>
                    );
                  })}
                </div>
              ) : null}

              {isExpanded && normalizedDeliveryCount > 0 ? (
                <section className="packagePlanSection">
                  <div className="packagePlanSectionDivider" aria-hidden="true" />
                  <h4 className="packagePlanSectionTitle">{deliveryLabel}</h4>
                  <ul className="packagePlanList">
                    {Array.from({ length: normalizedDeliveryCount }, (_, index) => {
                      const detail = item.delivery?.[index];
                      const hasDetail = Boolean(detail && detail !== missingValue);
                      const rowKey = `delivery:${index}`;

                      return (
                      <li
                        key={`delivery-${index}`}
                        className="packagePlanListItem"
                        data-highlighted={highlightedRow === rowKey ? "true" : "false"}
                        data-missing={hasDetail ? "false" : "true"}
                        onBlur={() => setHighlightedRow(null)}
                        onFocus={() => setHighlightedRow(rowKey)}
                        onMouseEnter={() => setHighlightedRow(rowKey)}
                        onMouseLeave={() => setHighlightedRow(null)}
                        tabIndex={0}
                      >
                        {hasDetail ? detail : missingValue}
                      </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}

              {isExpanded && item.note ? <p className="packagePlanNote">{item.note}</p> : null}
            </article>
          );
        })}
      </div>

      <div className="packageAssistantCta">
        <p>Des questions sur ces packages ? Notre agent IA &quot;MyAssistant&quot; peut y repondre.</p>
        <button className="packageAssistantButton" type="button" onClick={openAssistant}>
          Demander a MyAssistant
        </button>
      </div>
    </section>
  );
}
