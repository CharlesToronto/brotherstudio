"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, FileText, Heart, Map, MapPin, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";
import { RealEstateNavigation } from "@/components/RealEstateNavigation";

type ProjectProfile = {
  id: string;
  title: string;
  location: string;
  status: string;
  price: string;
  image: string;
  images?: string[];
  documents: ProjectDocument[];
  category: string;
  rooms: string;
  area: string;
  exterior: string;
  description: string;
  facts: { label: string; value: string }[];
};

type ProjectDocument = {
  title: string;
  type: string;
  href?: string;
};

const imageFallback = "/immobilier/monthey/vue-1.png";

const projectProfiles: Record<string, Partial<ProjectProfile>> = {
  "monthey-appartement-45": {
    title: "Appartement 4,5 pièces — Monthey",
    location: "Monthey · Valais",
    status: "À vendre",
    price: "CHF 650’000",
    image: "/immobilier/monthey/vue-1.png",
    images: ["/immobilier/monthey/vue-1.png", "/immobilier/monthey/vue-2.jpg"],
    category: "Appartement",
    rooms: "4,5 pièces",
    area: "130 m²",
    exterior: "2 places de parc",
    description: "Appartement de 4,5 pièces composé d’une cuisine avec salle à manger, d’un salon, de trois chambres et de deux salles d’eau. Deux places de parc extérieures sont incluses.",
    documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/monthey.html" }],
  },
  "illarsaz-appartement-4": {
    title: "Appartement 4 pièces — Illarsaz",
    location: "Illarsaz · Valais",
    status: "À vendre",
    price: "CHF 620’000",
    image: "/immobilier/illarsaz/vue-1.jpg",
    images: ["/immobilier/illarsaz/vue-1.jpg", "/immobilier/illarsaz/vue-2.jpg"],
    category: "Appartement",
    rooms: "4 pièces",
    area: "110 m²",
    exterior: "Box + place de parc",
    description: "Appartement de 4 pièces comprenant deux chambres, un dressing, un box et une place de parc extérieure incluse.",
    documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/illarsaz.html" }],
  },
  "morgins-chalet": {
    title: "Chalet à vendre — Morgins",
    location: "Morgins · Valais",
    status: "À vendre",
    price: "CHF 650’000",
    image: "/immobilier/morgins-chalet/vue-1.jpg",
    images: ["/immobilier/morgins-chalet/vue-1.jpg", "/immobilier/morgins-chalet/vue-2.jpg"],
    category: "Maison & villa",
    rooms: "Chalet",
    area: "98 m²",
    exterior: "Parcelle 518 m²",
    description: "Chalet à vendre à Morgins, d’une surface de 98 m² sur une parcelle de 518 m².",
    documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/morgins-chalet.html" }],
  },
  "lens-appartement-45": { title: "Appartement 4,5 pièces — Lens", location: "Région de Lens · Valais", status: "Projet neuf", price: "CHF 885’000", image: "/immobilier/lens-appartement-45/vue-1.jpg", images: ["/immobilier/lens-appartement-45/vue-1.jpg", "/immobilier/lens-appartement-45/vue-2.jpg"], category: "Projet neuf", rooms: "4,5 pièces", area: "118 m²", exterior: "Vente sur plans", description: "Immeuble de quatre appartements de 4,5 pièces. Permis de construire délivré en avril 2026, à 8 km de Sierre.", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/lens-appartement-45.html" }] },
  "lens-appartement-35": { title: "Appartement 3,5 pièces — Lens", location: "Région de Lens · Valais", status: "Projet neuf", price: "CHF 585’000", image: "/immobilier/lens-appartement-35/vue-1.jpg", images: ["/immobilier/lens-appartement-35/vue-1.jpg", "/immobilier/lens-appartement-35/vue-2.jpg"], category: "Projet neuf", rooms: "3,5 pièces", area: "71 m²", exterior: "Vente sur plans", description: "Appartement de 3,5 pièces proposé sur plans. Permis de construire délivré en mars 2026.", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/lens-appartement-35.html" }] },
  "lens-villa-construire": { title: "Villa à construire — Lens", location: "Lens · Valais", status: "À construire", price: "CHF 1’300’000", image: "/immobilier/lens-villa/vue-1.jpg", images: ["/immobilier/lens-villa/vue-1.jpg", "/immobilier/lens-villa/vue-2.jpg"], category: "Maison & villa", rooms: "Villa", area: "À compléter", exterior: "Projet neuf", description: "Projet de villa à construire à Lens. La surface et la parcelle ne sont pas indiquées dans la fiche disponible.", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/lens-villa.html" }] },
  "ollon-maison-renover": { title: "Maison à rénover + 2 granges", location: "Ollon · Vaud", status: "À rénover", price: "CHF 600’000", image: "/immobilier/ollon/vue-1.jpg", images: ["/immobilier/ollon/vue-1.jpg", "/immobilier/ollon/vue-2.jpg"], category: "Maison & villa", rooms: "3,5 pièces", area: "133 m²", exterior: "2 granges", description: "Maison de 3,5 pièces à rénover entièrement, accompagnée de deux granges à transformer en habitation. Places de parc disponibles.", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/ollon.html" }] },
  "soleure-terrain": { title: "Terrain constructible — Soleure", location: "Canton de Soleure", status: "Projet + permis", price: "CHF 4’550’000", image: "/immobilier/soleure/vue-1.jpg", category: "Terrain", rooms: "2 immeubles de 3 étages", area: "3’129 m²", exterior: "Permis 2026", description: "Terrain constructible de 3’129 m² pour un projet de deux immeubles de trois étages, avec permis de construire 2026.", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/soleure.html" }] },
  "chamoson-terrain": { title: "Mayen de Chamoson — Ovronnaz", location: "Chamoson · Ovronnaz", status: "Terrain", price: "Prix sur demande", image: "/immobilier/chamoson/vue-1.jpg", category: "Terrain", rooms: "Zone touristique", area: "1’738 m²", exterior: "Densité 0,30 / 0,50", description: "Terrain en zone touristique de 1’738 m², dont 339 m² avec une densité de 0,30 et 1’399 m² avec une densité de 0,50.", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/chamoson.html" }] },
  "valais-central-terrain": { title: "Terrain constructible — Valais central", location: "Valais central", status: "Projet + permis", price: "Prix sur demande", image: "/immobilier/valais-central/vue-1.jpg", category: "Terrain", rooms: "24 appartements", area: "2’890 m²", exterior: "Permis de construire", description: "Projet immobilier avec permis de construire sur une surface de 2’890 m², pour 24 appartements.", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/valais-central.html" }] },
  "morgins-raccard": { title: "Chalet à rafraîchir — Morgins", location: "Morgins · Valais", status: "À rafraîchir", price: "CHF 660’000", image: "/immobilier/morgins-raccard/vue-1.jpg", images: ["/immobilier/morgins-raccard/vue-1.jpg", "/immobilier/morgins-raccard/vue-2.jpg"], category: "Raccard & mayen", rooms: "Chalet", area: "96 m²", exterior: "Parcelle 514 m²", description: "Chalet de 96 m² sur une parcelle de 514 m², proche des commodités, facile d’accès et à rafraîchir.", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/morgins-raccard.html" }] },
  "val-de-bagnes-grange": { title: "Grange avec chambre — Val de Bagnes", location: "Val de Bagnes · Valais", status: "À vendre", price: "CHF 120’000", image: "/immobilier/val-de-bagnes/vue-1.jpg", images: ["/immobilier/val-de-bagnes/vue-1.jpg", "/immobilier/val-de-bagnes/vue-2.jpg"], category: "Raccard & mayen", rooms: "1 chambre", area: "8’500 m²", exterior: "Grange", description: "Grange à vendre avec une chambre, sur une parcelle de 8’500 m².", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/val-de-bagnes.html" }] },
  "saviese-mayen": { title: "Mayen à rénover — Savièse", location: "Savièse · Valais", status: "À rénover", price: "CHF 275’000", image: "/immobilier/saviese/vue-1.jpg", images: ["/immobilier/saviese/vue-1.jpg", "/immobilier/saviese/vue-2.jpg"], category: "Raccard & mayen", rooms: "Résidence secondaire", area: "105 m²", exterior: "Parcelle 349 m²", description: "Mayen à rénover destiné à la résidence secondaire uniquement, avec une superficie au sol de 105 m² sur une parcelle de 349 m².", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/saviese.html" }] },
  "corps-ferme-fribourgeois": { title: "Corps de ferme fribourgeois", location: "Suisse romande", status: "À rénover", price: "CHF 900’000", image: "/immobilier/corps-ferme/vue-1.jpg", category: "À rénover", rooms: "2 appartements à créer", area: "Jardin 2’400 m²", exterior: "Grange + étage", description: "Corps de ferme très volumineux à rénover entièrement, avec deux appartements à créer dans la grange et un jardin de 2’400 m² non constructible.", documents: [{ title: "Fiche du bien", type: "WEB", href: "/immobilier/documents/corps-ferme.html" }] },
};

function getProject(projectId: string): ProjectProfile {
  const project = projectProfiles[projectId] ?? {};
  return {
    id: projectId,
    title: project.title ?? "Profil du projet immobilier",
    location: project.location ?? "Localisation à compléter",
    status: project.status ?? "À vendre",
    price: project.price ?? "Prix sur demande",
    image: project.image ?? imageFallback,
    images: project.images?.length ? project.images : undefined,
    documents: project.documents ?? [{ title: "Brochure du bien", type: "PDF" }],
    category: project.category ?? "Projet immobilier",
    rooms: project.rooms ?? "À compléter",
    area: project.area ?? "À compléter",
    exterior: project.exterior ?? "À compléter",
    description:
      project.description ??
      "Les informations détaillées de ce projet seront ajoutées prochainement. Contactez-nous pour recevoir les premiers éléments disponibles et être informé de la suite du dossier.",
    facts: project.facts ?? [
      { label: "Type de bien", value: project.category ?? "À compléter" },
      { label: "Pièces", value: project.rooms ?? "À compléter" },
      { label: "Surface habitable", value: project.area ?? "À compléter" },
      { label: "Extérieur / stationnement", value: project.exterior ?? "À compléter" },
      { label: "Disponibilité", value: "À convenir" },
    ],
  };
}

export function RealEstateProjectProfile({ locale, projectId }: { locale: Locale; projectId: string }) {
  const project = getProject(projectId);
  const [favorite, setFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const gallery = project.images?.length ? project.images : [project.image];
  const isFrench = locale === "fr";

  return (
    <>
      <RealEstateNavigation locale={locale} active="listings" />
      <main className="siteMain realEstateSitePage realEstateProfilePage">
      <div className="realEstateProfileShell">
        <nav className="realEstateProfileBreadcrumbs" aria-label={isFrench ? "Fil d’Ariane" : "Breadcrumbs"}>
          <Link href={withLocalePath(locale, "/immobilier/biens")}><ChevronLeft aria-hidden="true" size={14} /> {isFrench ? "Retour aux biens" : "Back to properties"}</Link>
          <span aria-hidden="true">/</span>
          <span>{project.title}</span>
        </nav>

        <header className="realEstateProfileHeader">
          <div>
            <span className="realEstateProfileBadge"><Sparkles aria-hidden="true" size={12} /> {project.status}</span>
            <h1>{project.title}</h1>
            <p><MapPin aria-hidden="true" size={17} /> {project.location}</p>
          </div>
          <div className="realEstateProfileHeaderAside">
            <p className="realEstateProfilePriceLabel">{isFrench ? "Prix de vente" : "Sale price"}</p>
            <p className="realEstateProfilePrice">{project.price}</p>
            <button className="realEstateProfileFavorite" type="button" onClick={() => setFavorite((value) => !value)} aria-pressed={favorite} aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
              <Heart aria-hidden="true" size={21} fill={favorite ? "currentColor" : "none"} />
            </button>
          </div>
        </header>

        <section className="realEstateProfileGallery" data-single-image={gallery.length === 1 ? "true" : "false"} aria-label={isFrench ? "Galerie du projet" : "Project gallery"}>
          <button className="realEstateProfileHeroImage" type="button" onClick={() => setActiveImage(0)} aria-label="Voir la photo principale">
            <Image src={gallery[activeImage]} alt={project.title} fill priority sizes="(max-width: 800px) 100vw, 58vw" />
          </button>
          {gallery.length > 1 ? (
            <div className="realEstateProfileGalleryRail">
              {gallery.slice(1).map((image, index) => (
                <button className={`realEstateProfileGalleryThumb${activeImage === index + 1 ? " is-active" : ""}`} key={`${image}-${index}`} type="button" onClick={() => setActiveImage(index + 1)} aria-label={`Voir la photo ${index + 2}`}>
                  <Image src={image} alt="" fill sizes="(max-width: 800px) 25vw, 20vw" />
                </button>
              ))}
              <button className="realEstateProfileAllPhotos" type="button" onClick={() => setActiveImage(0)}><span>{gallery.length}</span> {isFrench ? "Toutes les photos" : "All photos"} <ArrowUpRight aria-hidden="true" size={15} /></button>
            </div>
          ) : null}
        </section>

        <div className="realEstateProfileTabs" role="tablist">
          <a className="is-active" href="#property">{isFrench ? "Le bien" : "Property"}</a>
          <a href="#gallery">{isFrench ? "Galerie" : "Gallery"}</a>
          <a href="#parcel">{isFrench ? "Parcelle" : "Parcel"}</a>
          <a href="#documents">{isFrench ? "Documents" : "Documents"}</a>
        </div>

        <div className="realEstateProfileLayout">
          <div className="realEstateProfileContent">
            <section id="property" className="realEstateProfileFacts" aria-label={isFrench ? "Résumé du bien" : "Property summary"}>
              <div><Ruler aria-hidden="true" size={20} /><strong>{project.rooms}</strong><span>{isFrench ? "pièces" : "rooms"}</span></div>
              <div><Ruler aria-hidden="true" size={20} /><strong>{project.area}</strong><span>{isFrench ? "habitables" : "living area"}</span></div>
              <div><Map aria-hidden="true" size={20} /><strong>{project.exterior}</strong><span>{isFrench ? "extérieur" : "outdoor"}</span></div>
            </section>

            <section className="realEstateProfileSection">
              <p className="realEstateProfileOverline">{project.category}</p>
              <h2>{isFrench ? "Un projet à découvrir" : "A project to discover"}</h2>
              <p>{project.description}</p>
            </section>

            <section className="realEstateProfileSection realEstateProfileCharacteristics">
              <h2>{isFrench ? "Caractéristiques" : "Features"}</h2>
              <dl>{project.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
            </section>

            <section id="parcel" className="realEstateProfileSection realEstateProfileParcel">
              <h2>{isFrench ? "Informations de la parcelle" : "Parcel information"}</h2>
              <div className="realEstateProfileParcelCard"><Map aria-hidden="true" size={28} /><span>{isFrench ? "Plan cadastral et données de parcelle à compléter" : "Cadastral plan and parcel details to be added"}</span></div>
            </section>

            <section id="documents" className="realEstateProfileSection realEstateProfileDocuments">
              <h2>{isFrench ? "Documents" : "Documents"}</h2>
              {project.documents.map((document) => {
                const content = <><FileText aria-hidden="true" size={21} /><div><strong>{document.title}</strong><span>{document.type} · {document.href ? (isFrench ? "Ouvrir dans le navigateur" : "Open in browser") : (isFrench ? "À venir" : "Coming soon")}</span></div><span>{document.href ? (isFrench ? "Consulter" : "View") : (isFrench ? "À venir" : "Coming soon")} <ArrowUpRight aria-hidden="true" size={15} /></span></>;
                return document.href ? <a className="realEstateProfileDocument" href={document.href} key={document.title} target="_blank" rel="noreferrer">{content}</a> : <div className="realEstateProfileDocument" key={document.title}>{content}</div>;
              })}
            </section>
          </div>

          <aside className="realEstateProfileContact">
            <p className="realEstateProfilePriceLabel">{isFrench ? "Prix de vente" : "Sale price"}</p>
            <strong>{project.price}</strong>
            <hr />
            <h2>{isFrench ? "Visiter ce bien" : "Visit this property"}</h2>
            <p>{isFrench ? "Planifiez une visite et découvrez cette propriété." : "Schedule a visit and discover this property."}</p>
            <form onSubmit={(event) => event.preventDefault()}>
              <input aria-label="Nom complet" placeholder={isFrench ? "Nom complet *" : "Full name *"} required />
              <input type="email" aria-label="Adresse e-mail" placeholder={isFrench ? "Adresse e-mail *" : "Email address *"} required />
              <input type="tel" aria-label="Numéro de téléphone" placeholder={isFrench ? "Numéro de téléphone *" : "Phone number *"} required />
              <button type="submit">{isFrench ? "Organiser une visite" : "Arrange a visit"} <ArrowUpRight aria-hidden="true" size={16} /></button>
            </form>
            <div className="realEstateProfileTrust"><ShieldCheck aria-hidden="true" size={17} /> {isFrench ? "Réponse personnalisée par Brother Studio" : "Personal reply from Brother Studio"}</div>
          </aside>
        </div>
      </div>
      </main>
    </>
  );
}
