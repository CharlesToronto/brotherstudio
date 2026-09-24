"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

type ListingCategory = "Appartement" | "Maison & villa" | "Projet neuf" | "Terrain";
type ListingFilter =
  | "Tous les biens"
  | "Appartements"
  | "Maisons & villas"
  | "Projets neufs"
  | "Terrains";

type RealEstateListing = {
  id: string;
  category: ListingCategory;
  status: string;
  location: string;
  title: string;
  rooms: string;
  area: string;
  exterior: string;
  price: string;
  image: string;
  href: string;
  featured?: boolean;
};

const listings: RealEstateListing[] = [
  {
    id: "plantaz-01",
    category: "Projet neuf",
    status: "Disponible",
    location: "Nyon · Vaud",
    title: "Appartement 01 — Plantaz",
    rooms: "3,5 pièces",
    area: "82 m²",
    exterior: "Terrasse",
    price: "Prix sur demande",
    image: "/plantaz-building-cover.jpg",
    href: "/mywebsite/plantaz#appartement-1",
    featured: true,
  },
  {
    id: "plantaz-02",
    category: "Appartement",
    status: "Disponible",
    location: "Nyon · Vaud",
    title: "Appartement 02 — Plantaz",
    rooms: "3,5 pièces",
    area: "82 m²",
    exterior: "Terrasse",
    price: "Prix sur demande",
    image: "/uploads/e82d6738-257e-46d7-b904-5c5aa456d130-1790133926077.webp",
    href: "/mywebsite/plantaz#appartement-2",
  },
  {
    id: "plantaz-03",
    category: "Appartement",
    status: "Disponible",
    location: "Nyon · Vaud",
    title: "Appartement 03 — Plantaz",
    rooms: "3,5 pièces",
    area: "82 m²",
    exterior: "Balcon",
    price: "Prix sur demande",
    image: "/uploads/327cab85-e089-4184-84b5-4dd3af011c59-1790133904197.webp",
    href: "/mywebsite/plantaz#appartement-3",
  },
  {
    id: "plantaz-04",
    category: "Appartement",
    status: "Disponible",
    location: "Nyon · Vaud",
    title: "Appartement 04 — Plantaz",
    rooms: "3,5 pièces",
    area: "82 m²",
    exterior: "Balcon",
    price: "Prix sur demande",
    image: "/uploads/42e09bd8-741a-4a85-ab5e-9137dad8ad00-1790262152067.webp",
    href: "/mywebsite/plantaz#appartement-4",
  },
  {
    id: "plantaz-05",
    category: "Appartement",
    status: "Disponible",
    location: "Nyon · Vaud",
    title: "Appartement 05 — Plantaz",
    rooms: "2,5 pièces",
    area: "51 m²",
    exterior: "Balcon",
    price: "Prix sur demande",
    image: "/uploads/e51c42c0-ca5e-42c2-9d28-55396c1a7340-1790133842861.webp",
    href: "/mywebsite/plantaz#appartement-5",
  },
  {
    id: "plantaz-06",
    category: "Appartement",
    status: "Disponible",
    location: "Nyon · Vaud",
    title: "Appartement 06 — Plantaz",
    rooms: "2,5 pièces",
    area: "51 m²",
    exterior: "Balcon",
    price: "Prix sur demande",
    image: "/uploads/9b0c5519-0488-4f70-bf10-0fa7850d56b6-1790133797600.webp",
    href: "/mywebsite/plantaz#appartement-6",
  },
];

const filters: ListingFilter[] = [
  "Tous les biens",
  "Appartements",
  "Maisons & villas",
  "Projets neufs",
  "Terrains",
];

function filterToCategory(filter: ListingFilter): ListingCategory | null {
  if (filter === "Appartements") return "Appartement";
  if (filter === "Maisons & villas") return "Maison & villa";
  if (filter === "Projets neufs") return "Projet neuf";
  if (filter === "Terrains") return "Terrain";
  return null;
}

export function RealEstateListings({ locale }: { locale: Locale }) {
  const [activeFilter, setActiveFilter] = useState<ListingFilter>("Tous les biens");
  const [search, setSearch] = useState("");
  const [budget, setBudget] = useState("all");
  const [rooms, setRooms] = useState("Toutes les pièces");
  const [favorites, setFavorites] = useState<string[]>([]);
  const isFrench = locale === "fr";
  const contactHref = withLocalePath(locale, "/contact");

  const visibleListings = useMemo(() => {
    const category = filterToCategory(activeFilter);
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return listings.filter((listing) => {
      if (category && listing.category !== category) return false;
      if (budget === "on-request" && listing.price !== "Prix sur demande") return false;
      if (rooms !== "Toutes les pièces" && !listing.rooms.startsWith(rooms)) return false;
      if (!normalizedSearch) return true;

      return [listing.location, listing.title, listing.category]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedSearch);
    });
  }, [activeFilter, budget, rooms, search]);

  const toggleFavorite = (id: string) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id],
    );
  };

  return (
    <main className="siteMain realEstatePage">
      <section className="realEstateShell" aria-labelledby="real-estate-title">
        <div className="realEstateBreadcrumbs" aria-label={isFrench ? "Fil d’Ariane" : "Breadcrumbs"}>
          <Link href={withLocalePath(locale, "/")}>{isFrench ? "Accueil" : "Home"}</Link>
          <span aria-hidden="true">/</span>
          <span>{isFrench ? "Immobilier" : "Real estate"}</span>
        </div>

        <header className="realEstateHero">
          <div>
            <p className="realEstateEyebrow">Brother Studio — Immobilier</p>
            <h1 id="real-estate-title">{isFrench ? "Des lieux à vivre." : "Places to live."}</h1>
            <p className="realEstateIntro">
              {isFrench
                ? "Découvrez notre sélection de biens en Suisse romande."
                : "Discover our selection of properties in French-speaking Switzerland."}
            </p>
          </div>
          <Link className="realEstateSellButton" href={contactHref}>
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
                {filter}
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
                <option value="on-request">{isFrench ? "Prix sur demande" : "Price on request"}</option>
              </select>
              <ChevronDown aria-hidden="true" size={16} strokeWidth={1.5} />
            </label>
            <label className="realEstateSearchField">
              <span className="realEstateSearchFieldIcon" aria-hidden="true">⌂</span>
              <span className="srOnly">{isFrench ? "Pièces" : "Rooms"}</span>
              <select value={rooms} onChange={(event) => setRooms(event.target.value)}>
                <option>Toutes les pièces</option>
                <option>1,5</option>
                <option>2,5</option>
                <option>3,5</option>
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
              <select defaultValue="newest" aria-label={isFrench ? "Trier les biens" : "Sort properties"}>
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
              const isFavorite = favorites.includes(listing.id);

              return (
                <article className={`realEstateCard${listing.featured ? " realEstateCardFeatured" : ""}`} key={listing.id}>
                  <Link className="realEstateCardMedia" href={withLocalePath(locale, listing.href)}>
                    <Image
                      src={listing.image}
                      alt={listing.title}
                      fill
                      sizes="(max-width: 760px) 50vw, (max-width: 1100px) 50vw, 33vw"
                    />
                    <span className="realEstateCardStatus">{listing.status}</span>
                  </Link>
                  <button
                    className="realEstateFavoriteButton"
                    type="button"
                    aria-label={isFavorite ? `Retirer ${listing.title} des favoris` : `Ajouter ${listing.title} aux favoris`}
                    aria-pressed={isFavorite}
                    data-active={isFavorite ? "true" : "false"}
                    onClick={() => toggleFavorite(listing.id)}
                  >
                    <Heart aria-hidden="true" size={21} strokeWidth={1.5} fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                  <div className="realEstateCardBody">
                    <p className="realEstateCardLocation">{listing.location}</p>
                    <h2><Link href={withLocalePath(locale, listing.href)}>{listing.title}</Link></h2>
                    <p className="realEstateCardDetails">{listing.rooms} · {listing.area} · {listing.exterior}</p>
                    <div className="realEstateCardFooter">
                      <p className="realEstateCardPrice">{listing.price}</p>
                      <Link className="realEstateCardArrow" href={withLocalePath(locale, listing.href)} aria-label={`Découvrir ${listing.title}`}>↗</Link>
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
    </main>
  );
}
