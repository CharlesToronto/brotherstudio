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

type ListingCategory =
  | "Appartement"
  | "Maison & villa"
  | "Projet neuf"
  | "Terrain"
  | "Raccard & mayen"
  | "À rénover";
type ListingFilter =
  | "Tous les biens"
  | "Appartements"
  | "Maisons & villas"
  | "Projets neufs"
  | "Terrains"
  | "Raccards & mayens"
  | "À rénover";

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
    id: "monthey-appartement-45",
    category: "Appartement",
    status: "À vendre",
    location: "Monthey · Valais",
    title: "Appartement 4,5 pièces — Monthey",
    rooms: "4,5 pièces",
    area: "130 m²",
    exterior: "2 places de parc",
    price: "CHF 650’000",
    image: "https://immobiliervalaisan.ch/data/files/vente35pmonrhey.png",
    href: "https://immobiliervalaisan.ch/appartement",
  },
  {
    id: "illarsaz-appartement-4",
    category: "Appartement",
    status: "À vendre",
    location: "Illarsaz · Valais",
    title: "Appartement 4 pièces — Illarsaz",
    rooms: "4 pièces",
    area: "110 m²",
    exterior: "Box + place de parc",
    price: "CHF 620’000",
    image: "https://immobiliervalaisan.ch/data/files/aappartementvendreillarsaz.jpg",
    href: "https://immobiliervalaisan.ch/appartement",
  },
  {
    id: "lens-appartement-45",
    category: "Projet neuf",
    status: "Projet neuf",
    location: "Région de Lens · Valais",
    title: "Appartement 4,5 pièces — Lens",
    rooms: "4,5 pièces",
    area: "118 m²",
    exterior: "Vente sur plans",
    price: "CHF 885’000",
    image: "https://immobiliervalaisan.ch/data/files/avendreflantheyvalais_1773750039.jpg",
    href: "https://immobiliervalaisan.ch/appartement",
  },
  {
    id: "lens-appartement-35",
    category: "Projet neuf",
    status: "Projet neuf",
    location: "Région de Lens · Valais",
    title: "Appartement 3,5 pièces — Lens",
    rooms: "3,5 pièces",
    area: "71 m²",
    exterior: "Vente sur plans",
    price: "CHF 585’000",
    image: "https://immobiliervalaisan.ch/data/files/avendreflantheyvalais.jpg",
    href: "https://immobiliervalaisan.ch/appartement",
  },
  {
    id: "morgins-chalet",
    category: "Maison & villa",
    status: "À vendre",
    location: "Morgins · Valais",
    title: "Chalet à vendre — Morgins",
    rooms: "Chalet",
    area: "98 m²",
    exterior: "Parcelle 518 m²",
    price: "CHF 650’000",
    image: "https://immobiliervalaisan.ch/data/files/chaletvendremorgins.jpg",
    href: "https://immobiliervalaisan.ch/maison-villa",
  },
  {
    id: "lens-villa-construire",
    category: "Maison & villa",
    status: "À construire",
    location: "Lens · Valais",
    title: "Villa à construire — Lens",
    rooms: "Villa",
    area: "—",
    exterior: "Projet neuf",
    price: "CHF 1’300’000",
    image: "https://immobiliervalaisan.ch/data/files/capturedcran2026-04-17145848.jpg",
    href: "https://immobiliervalaisan.ch/maison-villa",
  },
  {
    id: "ollon-maison-renover",
    category: "Maison & villa",
    status: "À rénover",
    location: "Ollon · Vaud",
    title: "Maison à rénover + 2 granges",
    rooms: "3,5 pièces",
    area: "133 m²",
    exterior: "2 granges",
    price: "CHF 600’000",
    image: "https://immobiliervalaisan.ch/data/files/theme/maison-a-renover-ollon.jpg",
    href: "https://immobiliervalaisan.ch/maison-villa",
  },
  {
    id: "soleure-terrain",
    category: "Terrain",
    status: "Projet + permis",
    location: "Canton de Soleure",
    title: "Terrain constructible — Soleure",
    rooms: "2 immeubles de 3 étages",
    area: "3’129 m²",
    exterior: "Permis 2026",
    price: "CHF 4’550’000",
    image: "https://immobiliervalaisan.ch/data/files/img-1857175.jpg",
    href: "https://immobiliervalaisan.ch/terrain",
  },
  {
    id: "chamoson-terrain",
    category: "Terrain",
    status: "Terrain",
    location: "Chamoson · Ovronnaz",
    title: "Mayen de Chamoson — Ovronnaz",
    rooms: "Zone touristique",
    area: "1’738 m²",
    exterior: "Densité 0,30 / 0,50",
    price: "Prix sur demande",
    image: "https://immobiliervalaisan.ch/data/files/img-1857175.jpg",
    href: "https://immobiliervalaisan.ch/terrain",
  },
  {
    id: "valais-central-terrain",
    category: "Terrain",
    status: "Projet + permis",
    location: "Valais central",
    title: "Terrain constructible — Valais central",
    rooms: "24 appartements",
    area: "2’890 m²",
    exterior: "Permis de construire",
    price: "Prix sur demande",
    image: "https://immobiliervalaisan.ch/data/files/img-1857175.jpg",
    href: "https://immobiliervalaisan.ch/terrain",
  },
  {
    id: "morgins-raccard",
    category: "Raccard & mayen",
    status: "À rafraîchir",
    location: "Morgins · Valais",
    title: "Chalet à rafraîchir — Morgins",
    rooms: "Chalet",
    area: "96 m²",
    exterior: "Parcelle 514 m²",
    price: "CHF 660’000",
    image: "https://immobiliervalaisan.ch/data/files/chaletvendremorgins.jpg",
    href: "https://immobiliervalaisan.ch/raccard-mayen",
  },
  {
    id: "val-de-bagnes-grange",
    category: "Raccard & mayen",
    status: "À vendre",
    location: "Val de Bagnes · Valais",
    title: "Grange avec chambre — Val de Bagnes",
    rooms: "1 chambre",
    area: "8’500 m²",
    exterior: "Grange",
    price: "CHF 120’000",
    image: "https://immobiliervalaisan.ch/data/files/photos/mayenavendre-valdebagne.jpg",
    href: "https://immobiliervalaisan.ch/raccard-mayen",
  },
  {
    id: "saviese-mayen",
    category: "Raccard & mayen",
    status: "À rénover",
    location: "Savièse · Valais",
    title: "Mayen à rénover — Savièse",
    rooms: "Résidence secondaire",
    area: "105 m²",
    exterior: "Parcelle 349 m²",
    price: "CHF 275’000",
    image: "https://immobiliervalaisan.ch/data/files/a-vendre-mayen-zour-savise.jpg",
    href: "https://immobiliervalaisan.ch/raccard-mayen",
  },
  {
    id: "corps-ferme-fribourgeois",
    category: "À rénover",
    status: "À rénover",
    location: "Suisse romande",
    title: "Corps de ferme fribourgeois",
    rooms: "2 appartements à créer",
    area: "Jardin 2’400 m²",
    exterior: "Grange + étage",
    price: "CHF 900’000",
    image: "https://immobiliervalaisan.ch/data/files/photo_2025-03-14.jpg",
    href: "https://immobiliervalaisan.ch/a-renover",
  },
];

const filters: ListingFilter[] = [
  "Tous les biens",
  "Appartements",
  "Maisons & villas",
  "Projets neufs",
  "Terrains",
  "Raccards & mayens",
  "À rénover",
];

function filterToCategory(filter: ListingFilter): ListingCategory | null {
  if (filter === "Appartements") return "Appartement";
  if (filter === "Maisons & villas") return "Maison & villa";
  if (filter === "Projets neufs") return "Projet neuf";
  if (filter === "Terrains") return "Terrain";
  if (filter === "Raccards & mayens") return "Raccard & mayen";
  if (filter === "À rénover") return "À rénover";
  return null;
}

function resolveListingHref(locale: Locale, href: string) {
  return /^https?:\/\//i.test(href) ? href : withLocalePath(locale, href);
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
                  <Link className="realEstateCardMedia" href={resolveListingHref(locale, listing.href)}>
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
                    <h2><Link href={resolveListingHref(locale, listing.href)}>{listing.title}</Link></h2>
                    <p className="realEstateCardDetails">{listing.rooms} · {listing.area} · {listing.exterior}</p>
                    <div className="realEstateCardFooter">
                      <p className="realEstateCardPrice">{listing.price}</p>
                      <Link className="realEstateCardArrow" href={resolveListingHref(locale, listing.href)} aria-label={`Découvrir ${listing.title}`}>↗</Link>
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
