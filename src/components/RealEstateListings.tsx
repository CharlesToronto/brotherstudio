"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import type { PublicEstateProperty } from "@/lib/estate";
import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";
import { realEstateText } from "@/lib/realEstateTranslations";
import { RealEstateNavigation } from "@/components/RealEstateNavigation";
import { LandingBackgroundTransition } from "@/components/LandingBackgroundTransition";
import { RealEstateFooter } from "@/components/RealEstateFooter";

type ListingCategory =
  | "Appartement"
  | "Maison & villa"
  | "Chalet"
  | "Projet neuf"
  | "Terrain"
  | "Raccard & mayen"
  | "Immeuble locatif"
  | "À rénover";
type ListingFilter =
  | "Tous les biens"
  | "Appartements"
  | "Maison- villa"
  | "Chalet"
  | "Raccard- mayen"
  | "Terrain"
  | "Immeuble locatif";

const filters: ListingFilter[] = [
  "Tous les biens",
  "Appartements",
  "Chalet",
  "Immeuble locatif",
  "Maison- villa",
  "Raccard- mayen",
  "Terrain",
];

function filterToCategory(filter: ListingFilter): ListingCategory | null {
  if (filter === "Appartements") return "Appartement";
  if (filter === "Maison- villa") return "Maison & villa";
  if (filter === "Chalet") return "Chalet";
  if (filter === "Raccard- mayen") return "Raccard & mayen";
  if (filter === "Terrain") return "Terrain";
  if (filter === "Immeuble locatif") return "Immeuble locatif";
  return null;
}

function parseListingPrice(price: string): number | null {
  if (!/[0-9]/.test(price)) return null;
  const amount = Number(price.replace(/[^0-9]/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

export function RealEstateListings({ locale, listings }: { locale: Locale; listings: PublicEstateProperty[] }) {
  const [activeFilter, setActiveFilter] = useState<ListingFilter>("Tous les biens");
  const [search, setSearch] = useState("");
  const [budget, setBudget] = useState("all");
  const [rooms, setRooms] = useState("Toutes les pièces");
  const [sortOrder, setSortOrder] = useState("newest");
  const isFrench = locale === "fr";
  const t = (value: string) => realEstateText(value, locale);
  const valuationHref = withLocalePath(locale, "/immobilier/vendre");

  const visibleListings = useMemo(() => {
    const category = filterToCategory(activeFilter);
    const normalizedSearch = search.trim().toLocaleLowerCase();

    const filteredListings = listings.filter((listing) => {
      if (category && listing.category !== category) return false;
      if (budget !== "all") {
        const amount = parseListingPrice(listing.price);

        if (budget === "on-request") {
          if (amount !== null) return false;
        } else if (budget === "3000000+") {
          if (amount === null || amount <= 3_000_000) return false;
        } else {
          const [minimum, maximum] = budget.split("-").map(Number);
          if (amount === null || amount < minimum || amount >= maximum) return false;
        }
      }
      if (rooms !== "Toutes les pièces" && !listing.rooms.replace(".", ",").startsWith(rooms)) return false;
      if (!normalizedSearch) return true;

      return [listing.location, listing.title, listing.category].map((value) => realEstateText(value, locale))
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedSearch);
    });

    if (sortOrder === "newest") return filteredListings;

    return filteredListings.sort((first, second) => {
      const firstPrice = parseListingPrice(first.price);
      const secondPrice = parseListingPrice(second.price);

      // Keep properties without a listed price last in either direction.
      if (firstPrice === null) return secondPrice === null ? 0 : 1;
      if (secondPrice === null) return -1;
      return sortOrder === "price-low"
        ? firstPrice - secondPrice
        : secondPrice - firstPrice;
    });
  }, [activeFilter, budget, rooms, search, sortOrder, locale, listings]);

  return (
    <>
      <RealEstateNavigation locale={locale} active="listings" />
      <main id="real-estate-listings" className="siteMain realEstateSitePage realEstateListingsPage">
      <LandingBackgroundTransition pageId="real-estate-listings" triggerSelector=".realEstateResultsHeader" />
      <div className="realEstatePage">
      <section className="realEstateShell" aria-labelledby="real-estate-title">
        <div className="realEstateBreadcrumbs" aria-label={isFrench ? "Fil d’Ariane" : "Breadcrumbs"}>
          <Link href={withLocalePath(locale, "/")}>{isFrench ? "Accueil" : "Home"}</Link>
          <span aria-hidden="true">/</span>
          <span>{isFrench ? "Immobilier" : "Real estate"}</span>
        </div>

        <header className="realEstateHero">
          <div>
            <p className="realEstateEyebrow">{isFrench ? "Brother Studio — Immobilier" : "Brother Studio — Real Estate"}</p>
            <h1 id="real-estate-title">{isFrench ? "Des lieux à vivre." : "Places to live."}</h1>
            <p className="realEstateIntro">
              {isFrench
                ? "Découvrez notre sélection de biens en Suisse romande."
                : "Discover our selection of properties in French-speaking Switzerland."}
            </p>
          </div>
          <Link className="realEstateSellButton" href={valuationHref}>
            {isFrench ? "Vendre mon bien" : "Sell my property"}
            <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <div className="realEstateFilters" aria-label={isFrench ? "Filtres immobiliers" : "Property filters"}>
          <div className="realEstateFilterChips" role="tablist" aria-label={isFrench ? "Types de biens" : "Property types"}>
            {filters.map((filter) => (
              <button
                key={filter}
                className="realEstateFilterChip"
                type="button"
                role="tab"
                aria-selected={activeFilter === filter}
                data-active={activeFilter === filter ? "true" : "false"}
                onClick={() => setActiveFilter(filter)}
              >
                {t(filter)}
              </button>
            ))}
          </div>

          <div className="realEstateSearchBar">
            <label className="realEstateSearchField realEstateSearchFieldLocation">
              <MapPin aria-hidden="true" size={18} strokeWidth={1.5} />
              <span className="srOnly">{isFrench ? "Ville ou région" : "City or region"}</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={isFrench ? "Ville ou région" : "City or region"}
              />
            </label>
            <label className="realEstateSearchField">
              <span className="realEstateSearchFieldIcon" aria-hidden="true">₣</span>
              <span className="srOnly">{isFrench ? "Budget" : "Budget"}</span>
              <select value={budget} onChange={(event) => setBudget(event.target.value)}>
                <option value="all">{isFrench ? "Tous les budgets" : "All budgets"}</option>
                <option value="0-500000">CHF 0 – 500’000</option>
                <option value="500000-1000000">CHF 500’000 – 1’000’000</option>
                <option value="1000000-1500000">CHF 1’000’000 – 1’500’000</option>
                <option value="1500000-2000000">CHF 1’500’000 – 2’000’000</option>
                <option value="2000000-3000000">CHF 2’000’000 – 3’000’000</option>
                <option value="3000000+">CHF 3’000’000+</option>
                <option value="on-request">{isFrench ? "Prix sur demande" : "Price on request"}</option>
              </select>
              <ChevronDown aria-hidden="true" size={16} strokeWidth={1.5} />
            </label>
            <label className="realEstateSearchField">
              <span className="realEstateSearchFieldIcon" aria-hidden="true">⌂</span>
              <span className="srOnly">{isFrench ? "Pièces" : "Rooms"}</span>
              <select value={rooms} onChange={(event) => setRooms(event.target.value)}>
                <option value="Toutes les pièces">{isFrench ? "Toutes les pièces" : "All room counts"}</option>
                <option value="1,5">{isFrench ? "1,5" : "1.5"}</option>
                <option value="2,5">{isFrench ? "2,5" : "2.5"}</option>
                <option value="3,5">{isFrench ? "3,5" : "3.5"}</option>
              </select>
              <ChevronDown aria-hidden="true" size={16} strokeWidth={1.5} />
            </label>
            <button className="realEstateSearchButton" type="button">
              <Search aria-hidden="true" size={18} strokeWidth={1.6} />
              <span>{isFrench ? "Rechercher" : "Search"}</span>
            </button>
          </div>
        </div>

        <div className="realEstateResultsHeader">
          <p>{visibleListings.length} {isFrench ? "biens à découvrir" : "properties to discover"}</p>
          <div className="realEstateResultsActions">
            <label>
              <span>{isFrench ? "Trier :" : "Sort:"}</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label={isFrench ? "Trier les biens" : "Sort properties"}>
                <option value="newest">{isFrench ? "Nouveautés" : "Newest"}</option>
                <option value="price-low">{isFrench ? "Prix croissant" : "Price: low to high"}</option>
                <option value="price-high">{isFrench ? "Prix décroissant" : "Price: high to low"}</option>
              </select>
              <ChevronDown aria-hidden="true" size={14} strokeWidth={1.5} />
            </label>
            <button className="realEstateViewButton" type="button" aria-label={isFrench ? "Vue en grille" : "Grid view"} data-active="true">
              <SlidersHorizontal aria-hidden="true" size={17} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {visibleListings.length > 0 ? (
          <section className="realEstateGrid" aria-label={isFrench ? "Biens disponibles" : "Available properties"}>
            {visibleListings.map((listing) => {
              return (
                <article className={`realEstateCard${listing.featured ? " realEstateCardFeatured" : ""}`} key={listing.id}>
                  <Link className="realEstateCardMedia" href={withLocalePath(locale, `/immobilier/${listing.id}`)}>
                    <Image unoptimized={listing.image.startsWith("https:")}
                      src={listing.image}
                      alt={t(listing.title)}
                      fill
                      sizes="(max-width: 760px) 50vw, (max-width: 1100px) 50vw, 33vw"
                    />
                    <span className="realEstateCardStatus">{t(listing.status)}</span>
                  </Link>
                  <div className="realEstateCardBody">
                    <p className="realEstateCardLocation">{t(listing.location)}</p>
                    <h2><Link href={withLocalePath(locale, `/immobilier/${listing.id}`)}>{t(listing.title)}</Link></h2>
                    <p className="realEstateCardDetails">{[
                      t(listing.rooms),
                      listing.area ? `${isFrench ? "Surface habitation" : "Living area"} : ${t(listing.area)}` : '',
                      listing.outdoorArea ? `${isFrench ? "Surface extérieure" : "Outdoor area"} : ${t(listing.outdoorArea)}` : '',
                      t(listing.exterior),
                    ].filter(Boolean).join(' · ')}</p>
                    <div className="realEstateCardFooter">
                      <p className="realEstateCardPrice">{t(listing.price)}</p>
                      <Link className="realEstateCardArrow" href={withLocalePath(locale, `/immobilier/${listing.id}`)} aria-label={`Découvrir ${t(listing.title)}`}>↗</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="realEstateEmptyState">
            <h2>{isFrench ? "Aucun bien trouvé" : "No property found"}</h2>
            <p>{isFrench ? "Modifiez vos critères de recherche pour voir d’autres biens." : "Adjust your search criteria to see more properties."}</p>
          </div>
        )}
      </section>
      </div>
      </main>
      <RealEstateFooter locale={locale} />
    </>
  );
}

