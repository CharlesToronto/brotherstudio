import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { MaretsetContactForm } from "@/components/MaretsetContactForm";
import { MaretsetDarkTailObserver } from "@/components/MaretsetDarkTailObserver";
import { MaretsetDemandActivity } from "@/components/MaretsetDemandActivity";
import { MaretsetViewsCarousel } from "@/components/MaretsetViewsCarousel";
import { MaretsetWeather } from "@/components/MaretsetWeather";
import { ExpandableGallery } from "@/components/ui/gallery-animation";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

const basePath = "/maretset-site";

const highlights = [
  { labelFr: "Localisation", labelEn: "Location", valueFr: "Haute-Nendaz", valueEn: "Haute-Nendaz" },
  { labelFr: "Residence", labelEn: "Residence", valueFr: "2 appartements", valueEn: "2 apartments" },
  { labelFr: "Prix", labelEn: "Price", valueFr: "Des CHF 1'250'000", valueEn: "From CHF 1'250'000" },
  { labelFr: "Livraison", labelEn: "Delivery", valueFr: "Juillet 2027", valueEn: "July 2027" },
];

const apartments = [
  {
    name: "Apartment A",
    level: "Ground floor",
    availability: "Available",
    surface: "145 m²",
    price: "CHF 1'250'000",
    bedrooms: "3",
    bathrooms: "2",
    image: `${basePath}/images/maretset/plan-appartement-a.jpg`,
    document: `${basePath}/documents/plan-rez-de-chaussee.pdf`,
  },
  {
    name: "Apartment B",
    level: "Upper floor",
    availability: "Available on request",
    surface: "To confirm",
    price: "On request",
    bedrooms: "To confirm",
    bathrooms: "To confirm",
    image: `${basePath}/images/maretset/plan-appartement-b.jpg`,
    document: `${basePath}/documents/plan-etage.pdf`,
  },
];

const galleryImages = [
  { src: `${basePath}/images/project/exterior-main.jpg`, alt: "Maretset main exterior view" },
  { src: `${basePath}/images/project/exterior-sunset.jpg`, alt: "Maretset exterior at sunset" },
  { src: `${basePath}/images/project/hero-poster.jpg`, alt: "Maretset cinematic exterior poster" },
  { src: `${basePath}/images/project/living-view.jpg`, alt: "Maretset living room with view" },
  { src: `${basePath}/images/project/living-main.jpg`, alt: "Maretset main living area" },
  { src: `${basePath}/images/project/dining-kitchen.jpg`, alt: "Maretset dining and kitchen area" },
  { src: `${basePath}/images/project/kitchen-main.jpg`, alt: "Maretset kitchen view" },
  { src: `${basePath}/images/maretset/gallery-01.jpg`, alt: "Maretset exterior facade and balconies" },
  { src: `${basePath}/images/maretset/gallery-02.jpg`, alt: "Maretset bright living room under roof" },
  { src: `${basePath}/images/maretset/gallery-03.jpg`, alt: "Maretset interior material detail" },
  { src: `${basePath}/images/maretset/gallery-04.jpg`, alt: "Maretset kitchen and dining space" },
  { src: `${basePath}/images/maretset/gallery-05.jpg`, alt: "Maretset interior detail" },
  { src: `${basePath}/images/maretset/gallery-06.jpg`, alt: "Maretset bedroom atmosphere" },
  { src: `${basePath}/images/maretset/gallery-07.jpg`, alt: "Maretset soft bedroom light" },
  { src: `${basePath}/images/maretset/gallery-08.jpg`, alt: "Maretset kitchen detail" },
  { src: `${basePath}/images/maretset/gallery-09.jpg`, alt: "Maretset living room with mountain view" },
  { src: `${basePath}/images/maretset/gallery-10.jpg`, alt: "Maretset dining and living space" },
  { src: `${basePath}/images/maretset/gallery-11.jpg`, alt: "Maretset calm bedroom view" },
  { src: `${basePath}/images/maretset/gallery-12.jpg`, alt: "Maretset terrace at sunset" },
  { src: `${basePath}/images/maretset/gallery-13.jpg`, alt: "Maretset bright living room" },
];

const galleryRows = [
  galleryImages.filter((_, index) => index % 2 === 0),
  galleryImages.filter((_, index) => index % 2 === 1),
];

const locationActivities = [
  {
    image: `${basePath}/images/activities/haute-nendaz-panorama.webp`,
    titleFr: "Panorama alpin",
    titleEn: "Alpine panorama",
    descriptionFr: "Profiter des vues ouvertes sur Haute-Nendaz, les villages alpins et les sommets du Valais.",
    descriptionEn: "Enjoy open views over Haute-Nendaz, alpine villages, and the Valais mountain peaks.",
  },
  {
    image: `${basePath}/images/activities/nendaz-ski.webp`,
    titleFr: "Ski & domaine des 4 Vallées",
    titleEn: "Ski & 4 Vallées area",
    descriptionFr: "Accéder rapidement aux pistes, remontées mécaniques et journées de ski en altitude.",
    descriptionEn: "Reach ski slopes, lifts, and high-altitude winter days with ease.",
  },
  {
    image: `${basePath}/images/activities/nendaz-mountain-bike.webp`,
    titleFr: "VTT & sentiers",
    titleEn: "Mountain biking trails",
    descriptionFr: "Explorer les chemins de montagne en VTT, entre forêts, prairies et points de vue.",
    descriptionEn: "Explore mountain bike trails through forests, meadows, and scenic viewpoints.",
  },
  {
    image: `${basePath}/images/activities/nendaz-local-events.webp`,
    titleFr: "Vie locale & traditions",
    titleEn: "Local life & traditions",
    descriptionFr: "Découvrir les événements du village, les fêtes locales et l’ambiance authentique de la région.",
    descriptionEn: "Discover village events, local celebrations, and the authentic atmosphere of the region.",
  },
  {
    image: `${basePath}/images/activities/nendaz-hiking.webp`,
    titleFr: "Randonnée en montagne",
    titleEn: "Mountain hiking",
    descriptionFr: "Rejoindre des itinéraires de randonnée avec vues dégagées sur les reliefs environnants.",
    descriptionEn: "Access hiking routes with open views across the surrounding alpine landscape.",
  },
  {
    image: `${basePath}/images/activities/nendaz-restaurants.webp`,
    titleFr: "Restaurants & terrasses",
    titleEn: "Restaurants & terraces",
    descriptionFr: "Partager un moment en terrasse, entre chalets, restaurants et adresses conviviales.",
    descriptionEn: "Spend time on terraces, in chalets, restaurants, and relaxed local venues.",
  },
];

const constructionTimeline = [
  {
    dateFr: "Septembre 2026",
    dateEn: "September 2026",
    titleFr: "Permis & préparation",
    titleEn: "Permits & preparation",
    descriptionFr: "Validation du projet, coordination technique et préparation du lancement du chantier.",
    descriptionEn: "Project validation, technical coordination, and preparation before construction starts.",
  },
  {
    dateFr: "Octobre 2026",
    dateEn: "October 2026",
    titleFr: "Terrassement",
    titleEn: "Earthworks",
    descriptionFr: "Préparation du terrain et adaptation du site à la pente naturelle.",
    descriptionEn: "Preparing the land and adapting the site to the natural slope.",
  },
  {
    dateFr: "Novembre 2026",
    dateEn: "November 2026",
    titleFr: "Fondations",
    titleEn: "Foundations",
    descriptionFr: "Mise en place des bases structurelles et des premiers éléments porteurs.",
    descriptionEn: "Setting the structural base and first load-bearing elements.",
  },
  {
    dateFr: "Janvier 2027",
    dateEn: "January 2027",
    titleFr: "Structure",
    titleEn: "Structure",
    descriptionFr: "Élévation du bâtiment, volumes principaux et enveloppe architecturale.",
    descriptionEn: "Building elevation, main volumes, and architectural envelope.",
  },
  {
    dateFr: "Avril 2027",
    dateEn: "April 2027",
    titleFr: "Intérieurs",
    titleEn: "Interiors",
    descriptionFr: "Travaux intérieurs, finitions, équipements et contrôle qualité.",
    descriptionEn: "Interior works, finishes, equipment, and quality control.",
  },
  {
    dateFr: "Juillet 2027",
    dateEn: "July 2027",
    titleFr: "Livraison",
    titleEn: "Delivery",
    descriptionFr: "Finalisation du projet, remise des documents et préparation à l’emménagement.",
    descriptionEn: "Project completion, documentation handover, and move-in preparation.",
  },
];

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/mywebsite/maretset";
  const title = "Maretset · Real Estate Website";
  const description =
    locale === "fr"
      ? "Site immobilier premium pour la residence Maretset a Haute-Nendaz, Suisse."
      : "Premium real estate website for the Maretset residence in Haute-Nendaz, Switzerland.";

  return {
    title,
    description,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title,
      description,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
      images: [`${basePath}/images/project/hero-poster.jpg`],
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function MaretsetWebsitePage({ params }: LocalePageProps) {
  const locale = await resolveLocaleParam(params);
  const isFr = locale === "fr";

  return (
    <main className="maretsetWebsitePage">
      <nav className="maretsetWebsiteNav" aria-label="Maretset website navigation">
        <a className="maretsetWebsiteBrand" href="#top">
          <span>Maretset</span>
          <small>Haute-Nendaz · Valais</small>
        </a>
        <div className="maretsetWebsiteNavLinks">
          <a href="#project">{isFr ? "Projet" : "Project"}</a>
          <a href="#apartments">{isFr ? "Appartements" : "Apartments"}</a>
          <a href="#timeline">Timeline</a>
          <a href="#gallery">{isFr ? "Galerie" : "Gallery"}</a>
          <a href="#location">{isFr ? "Localisation" : "Location"}</a>
          <a href={`${basePath}/documents/maretset-documentation-complete.pdf`}>
            {isFr ? "Brochure" : "Brochure"}
          </a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className="maretsetWebsiteHero" id="top">
        <video
          className="maretsetWebsiteHeroVideo"
          src={`${basePath}/videos/hero-maretset-final.mp4`}
          poster={`${basePath}/images/project/hero-poster.jpg`}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="maretsetWebsiteHeroOverlay" />
        <div className="maretsetWebsiteHeroContent">
          <p className="maretsetWebsiteEyebrow">Haute-Nendaz · Valais · Suisse</p>
          <h1>{isFr ? "Une residence alpine presentee pour vendre" : "An alpine residence presented to sell"}</h1>
          <p>
            {isFr
              ? "Maretset rassemble video, images, plans, documentation et demande d'information dans une experience claire pour acheteurs qualifies."
              : "Maretset brings video, imagery, floor plans, documentation, and buyer inquiries into one clear real estate sales experience."}
          </p>
          <div className="maretsetWebsiteHeroActions">
            <a href="#apartments">{isFr ? "Voir les appartements" : "View apartments"}</a>
            <a href={`${basePath}/documents/maretset-documentation-complete.pdf`}>
              {isFr ? "Telecharger la brochure" : "Download brochure"}
            </a>
          </div>
        </div>
      </section>

      <section className="maretsetWebsiteHighlights" aria-label={isFr ? "Points cles" : "Key highlights"}>
        {highlights.map((item) => (
          <article key={item.labelEn}>
            <span>{isFr ? item.labelFr : item.labelEn}</span>
            <strong>{isFr ? item.valueFr : item.valueEn}</strong>
          </article>
        ))}
      </section>

      <section className="maretsetWebsiteSection maretsetWebsiteProject" id="project">
        <div className="maretsetWebsiteSectionIntro">
          <p className="maretsetWebsiteEyebrow">{isFr ? "Le projet" : "The project"}</p>
          <h2>{isFr ? "Construire avec la pente" : "Building with the slope"}</h2>
        </div>
        <div className="maretsetWebsiteProjectGrid">
          <div>
            <p>
              {isFr
                ? "A Haute-Nendaz, Maretset accompagne le relief sans le dominer. Une structure lisible, du bois, un enduit clair et de larges ouvertures cadrent les Alpes."
                : "In Haute-Nendaz, Maretset follows the terrain without dominating it. A clear structure, timber, light render, and generous openings frame the Alps."}
            </p>
            <dl className="maretsetWebsiteFacts">
              <div>
                <dt>{isFr ? "Adresse" : "Address"}</dt>
                <dd>Chemin du Maretset · 1997 Haute-Nendaz</dd>
              </div>
              <div>
                <dt>{isFr ? "Positionnement" : "Positioning"}</dt>
                <dd>{isFr ? "Residence contemporaine alpine" : "Contemporary alpine residence"}</dd>
              </div>
              <div>
                <dt>{isFr ? "Parcours" : "Journey"}</dt>
                <dd>{isFr ? "Decouvrir, comparer, telecharger, contacter" : "Discover, compare, download, inquire"}</dd>
              </div>
            </dl>
          </div>
          <Image
            src={`${basePath}/images/project/exterior-main.jpg`}
            alt="Maretset exterior view"
            width={1400}
            height={900}
            className="maretsetWebsiteProjectImage"
            priority
          />
        </div>
      </section>

      <section className="maretsetWebsiteVideoBand" aria-label="Maretset apartment video">
        <video
          src={`${basePath}/videos/apartments-maretset.mp4`}
          poster={`${basePath}/images/project/living-view.jpg`}
          loop
          playsInline
          controls
          preload="metadata"
        />
      </section>

      <section className="maretsetWebsiteSection" id="apartments">
        <div className="maretsetWebsiteSectionIntro maretsetWebsiteApartmentsIntro">
          <div>
            <p className="maretsetWebsiteEyebrow">{isFr ? "Disponibilites" : "Availability"}</p>
            <h2>{isFr ? "Deux appartements, une lecture simple" : "Two apartments, clearly presented"}</h2>
          </div>
          <a className="maretsetWebsiteDarkCta" href="#contact">
            {isFr ? "Demander les informations" : "Request information"}
          </a>
        </div>
        <div className="maretsetWebsiteApartmentGrid">
          {apartments.map((apartment) => (
            <article key={apartment.name} className="maretsetWebsiteApartmentCard">
              <Image src={apartment.image} alt={`${apartment.name} floor plan`} width={900} height={560} />
              <div className="maretsetWebsiteApartmentContent">
                <div className="maretsetWebsiteApartmentHeader">
                  <div>
                    <span>{apartment.level}</span>
                    <h3>{apartment.name}</h3>
                  </div>
                  <strong>{apartment.availability}</strong>
                </div>
                <dl className="maretsetWebsiteApartmentSpecs">
                  <div>
                    <dt>{isFr ? "Surface" : "Surface"}</dt>
                    <dd>{apartment.surface}</dd>
                  </div>
                  <div>
                    <dt>{isFr ? "Prix" : "Price"}</dt>
                    <dd>{apartment.price}</dd>
                  </div>
                  <div>
                    <dt>{isFr ? "Chambres" : "Bedrooms"}</dt>
                    <dd>{apartment.bedrooms}</dd>
                  </div>
                  <div>
                    <dt>{isFr ? "Salles de bain" : "Bathrooms"}</dt>
                    <dd>{apartment.bathrooms}</dd>
                  </div>
                </dl>
                <div className="maretsetWebsiteApartmentActions">
                  <a href={apartment.document}>{isFr ? "Telecharger le plan" : "Download floor plan"}</a>
                  <a href="#contact">{isFr ? "Question sur ce lot" : "Ask about this unit"}</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="maretsetWebsiteConstructionTimeline" id="timeline" aria-labelledby="maretset-construction-title">
        <div className="maretsetWebsiteConstructionHeader">
          <p className="maretsetWebsiteEyebrow">{isFr ? "Timeline" : "Timeline"}</p>
          <h2 id="maretset-construction-title">
            {isFr ? "Timeline de construction" : "Construction timeline"}
          </h2>
          <p className="maretsetWebsiteConstructionNote">
            {isFr ? "Dates estimatives à confirmer." : "Estimated dates to be confirmed."}
          </p>
        </div>
        <div className="maretsetWebsiteConstructionList" role="list">
          {constructionTimeline.map((step, index) => (
            <article key={step.titleEn} className="maretsetWebsiteConstructionStepGroup" role="listitem">
              <div className="maretsetWebsiteConstructionStep">
                <span className="maretsetWebsiteConstructionNumber">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="maretsetWebsiteConstructionCopy">
                  <span className="maretsetWebsiteConstructionDate">
                    {isFr ? step.dateFr : step.dateEn}
                  </span>
                  <h3>{isFr ? step.titleFr : step.titleEn}</h3>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="maretsetWebsiteSection maretsetWebsiteGallerySection" id="gallery">
        <div className="maretsetWebsiteSectionIntro">
          <p className="maretsetWebsiteEyebrow">{isFr ? "Galerie" : "Gallery"}</p>
          <h2>{isFr ? "Regards sur Maretset" : "Views of Maretset"}</h2>
        </div>
        <MaretsetViewsCarousel
          rows={galleryRows}
          images={galleryImages}
          ariaLabel={isFr ? "Carousel des vues Maretset" : "Maretset views carousel"}
        />
      </section>

      <MaretsetDarkTailObserver />

      <div className="maretsetWebsiteDarkTail">
        <section className="maretsetWebsiteSection maretsetWebsiteLocation" id="location">
          <div className="maretsetWebsiteSectionIntro">
            <p className="maretsetWebsiteEyebrow">{isFr ? "Localisation" : "Location"}</p>
            <h2>Haute-Nendaz, Valais</h2>
          </div>
          <MaretsetWeather locale={locale} />
          <ExpandableGallery
            className="maretsetWebsiteLocationActivities"
            items={locationActivities.map((activity) => ({
              image: activity.image,
              title: isFr ? activity.titleFr : activity.titleEn,
              description: isFr ? activity.descriptionFr : activity.descriptionEn,
              alt: isFr ? activity.titleFr : activity.titleEn,
            }))}
          />
        </section>

        <MaretsetDemandActivity locale={locale} />

        <section className="maretsetWebsiteFinalCta" id="contact">
          <p className="maretsetWebsiteEyebrow">{isFr ? "Demande projet" : "Project request"}</p>
          <h2>{isFr ? "Contacter CJ Construction via BrotherStudio" : "Contact CJ Construction through BrotherStudio"}</h2>
          <p>
            {isFr
              ? "Envoyez votre demande ici. BrotherStudio la recoit, la qualifie et la transmet a CJ Construction pour le projet Maretset."
              : "Send your request here. BrotherStudio receives it, qualifies it, and forwards it to CJ Construction for the Maretset project."}
          </p>
          <div className="maretsetWebsiteHeroActions">
            <a href={`${basePath}/documents/maretset-documentation-complete.pdf`}>
              {isFr ? "Telecharger la documentation" : "Download documentation"}
            </a>
          </div>
          <MaretsetContactForm locale={locale} />
        </section>

        <footer className="maretsetWebsiteFooter">
          <div>
            <strong>Maretset</strong>
            <p>Chemin du Maretset · 1997 Haute-Nendaz · Valais, Suisse</p>
          </div>
          <nav aria-label={isFr ? "Liens du site Maretset" : "Maretset site links"}>
            <a href="#apartments">{isFr ? "Appartements" : "Apartments"}</a>
            <a href="#gallery">{isFr ? "Galerie" : "Gallery"}</a>
            <a href={`${basePath}/documents/maretset-documentation-complete.pdf`}>
              {isFr ? "Documentation" : "Documentation"}
            </a>
            <Link href={withLocalePath(locale, "/contact")}>Contact</Link>
          </nav>
          <p>
            {isFr ? "Site de vente par" : "Sales website by"}{" "}
            <Link href={withLocalePath(locale, "/")}>BrotherStudio</Link>
          </p>
        </footer>
      </div>

      <div className="maretsetWebsiteMobileBar" aria-label={isFr ? "Actions rapides" : "Quick actions"}>
        <a href={`${basePath}/documents/maretset-documentation-complete.pdf`}>
          {isFr ? "Brochure" : "Brochure"}
        </a>
        <a href="#contact">{isFr ? "Contact" : "Contact"}</a>
      </div>
    </main>
  );
}
