import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlantazContactForm } from "@/components/PlantazContactForm";
import { PlantazAvailabilityExplorer } from "@/components/PlantazAvailabilityExplorer";
import { PlantazProgressRail } from "@/components/PlantazProgressRail";
import { PlantazPlansCarousel } from "@/components/PlantazPlansCarousel";
import { PlantazGallery } from "@/components/PlantazGallery";
import { MaretsetWeather } from "@/components/MaretsetWeather";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";
import { getProjectFeedbackProject } from "@/lib/projectFeedbackStore";
import { listProjectReferences } from "@/lib/projectReferenceStore";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LocalePageProps = { params: Promise<{ locale: string }> };

const plantazConstructionTimeline = [
  { date: "Février 2026", title: "Études & autorisations", description: "Finalisation du projet, coordination technique et préparation du chantier." },
  { date: "Mars 2027", title: "Préparation du terrain", description: "Installation du chantier et préparation du site pour les travaux." },
  { date: "Avril 2027", title: "Fondations", description: "Mise en place des bases structurelles et des premiers éléments porteurs." },
  { date: "Juillet 2027", title: "Structure du bâtiment", description: "Élévation du bâtiment et mise en place de son enveloppe architecturale." },
  { date: "Novembre 2027", title: "Aménagements intérieurs", description: "Finitions, équipements, contrôles et préparation des appartements." },
  { date: "Décembre 2027", title: "Livraison", description: "Finalisation du projet et remise des documents avant l’emménagement." },
];

async function getPlantazProject() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .ilike("name", "%Plantaz%")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) return null;

  const project = await getProjectFeedbackProject(data.id as string);
  if (!project) return null;

  let references = { folders: [], files: [] } as Awaited<ReturnType<typeof listProjectReferences>>;
  try {
    references = await listProjectReferences(project.id);
  } catch {
    // The website remains available when the optional reference migration is pending.
  }

  return { project, references };
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/mywebsite/plantaz";
  return {
    title: "Plantaz · Appartement disponible",
    description: "Découvrez le projet Plantaz, son environnement et l’appartement disponible.",
    alternates: { canonical: withLocalePath(locale, pathname), languages: getLanguageAlternates(pathname) },
    openGraph: { title: "Plantaz · Appartement disponible", description: "Le projet Plantaz par BrotherStudio." },
  };
}

export default async function PlantazWebsitePage({ params }: LocalePageProps) {
  await resolveLocaleParam(params);
  const data = await getPlantazProject();
  if (!data) notFound();

  const { project, references } = data;
  const images = project.versions.flatMap((version) => version.images);
  const heroImage = images[0];
  const galleryImages = images.map((image, index) => index === 3 ? { ...image, url: "/plantaz-gallery-04.png" } : image);
  const plans = references.files.filter((file) => file.mimeType === "application/pdf" || file.filename.toLowerCase().endsWith(".pdf"));
  const address = project.address || "Plantaz";
  const mapUrl = project.mapEmbedUrl || `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <main className="plantazWebsitePage">
      <PlantazProgressRail />
      <header className="plantazWebsiteNav">
        <a href="#top" className="plantazWebsiteBrand" aria-label="Plantaz — retour en haut"><img src="/plantaz-logo.png" alt="Plantaz — projet résidentiel" /></a>
        <nav aria-label="Navigation Plantaz">
          <a href="#environnement">Environnement</a><a href="#plans">Plans</a><a href="#construction">Construction</a><a href="#gallery">Galerie</a><a href="#appartement">Appartement</a><a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="plantazHero" id="top">
        {heroImage ? <img src={heroImage.url} alt="Vue du projet Plantaz" /> : null}
        <div className="plantazHeroShade" />
        <div className="plantazHeroContent"><p className="plantazEyebrow">{address}</p><h1>Plantaz</h1><p>Un appartement disponible dans un environnement calme, pensé pour la lumière et la continuité avec le paysage.</p><a className="plantazTextLink" href="#appartement">Découvrir l’appartement <span>↘</span></a></div>
      </section>

      <section className="plantazSection plantazEnvironment" id="environnement">
        <div className="plantazSectionIntro"><p className="plantazEyebrow">L’environnement</p><h2>Habiter dans un cadre qui respire.</h2><p>Plantaz s’inscrit dans un contexte résidentiel à découvrir à travers la carte, les alentours et les points d’intérêt du projet.</p></div>
        <div className="plantazEnvironmentGrid"><div className="plantazMap"><iframe title="Carte de l’environnement du projet Plantaz" src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div><div className="plantazEnvironmentImage"><img src="/plantaz-environment-lake.png" alt="Vue aérienne du lac et des montagnes depuis les alentours de Plantaz" /></div></div>
        <div className="plantazInterestGrid"><article className="plantazEnvironmentWeather plantazEnvironmentWeather--inline"><MaretsetWeather locale="fr" latitude={46.3934314789} longitude={6.2336004928} location="Nyon, Vaud" timezone="Europe/Zurich" /></article><article><span>02</span><h3>Un cadre résidentiel</h3><p>Une implantation sobre, ouverte sur son environnement.</p></article><article><span>03</span><h3>Les points d’intérêt</h3><p>Services, mobilité et nature réunis autour du projet.</p></article></div>
        <details className="plantazInterestDetails" open><summary><span>Points d’intérêt</span><strong>Découvrir les temps d’accès</strong></summary><div className="plantazInterestTableWrap"><table className="plantazInterestTable"><thead><tr><th scope="col">Point d’intérêt</th><th scope="col">Temps d’accès</th></tr></thead><tbody><tr><th scope="row">Gare Les Plantaz</th><td>3–5 min à pied</td></tr><tr><th scope="row">Gare de Nyon</th><td>10–15 min à pied</td></tr><tr><th scope="row">Centre-ville de Nyon</th><td>15–20 min à pied</td></tr><tr><th scope="row">Château de Nyon / Musée romain</th><td>15–20 min à pied</td></tr><tr><th scope="row">Lac Léman / Nyon-Rive</th><td>20–25 min à pied</td></tr><tr><th scope="row">Centre commercial La Combe / Coop</th><td>10–15 min à pied</td></tr><tr><th scope="row">Hôpital de Nyon</th><td>20–25 min à pied</td></tr><tr><th scope="row">Paléo / La Scène Nord</th><td>5–10 min en transports</td></tr><tr><th scope="row">Genève-Cornavin</th><td>Environ 25–30 min en transports</td></tr><tr><th scope="row">Genève</th><td>Environ 25–30 min en voiture</td></tr><tr><th scope="row">Aéroport de Genève</th><td>Environ 20–25 min en voiture ou 35–45 min en transports</td></tr><tr><th scope="row">Lausanne</th><td>Environ 30–35 min en train ou 40–50 min en voiture</td></tr></tbody></table></div></details>
      </section>

      <section className="plantazSection plantazPlans" id="plans"><div className="plantazSectionIntro"><p className="plantazEyebrow">Documentation</p><h2>Les plans du projet.</h2><p>Téléchargez les documents disponibles pour comprendre les volumes et l’organisation de l’appartement.</p></div><PlantazPlansCarousel plans={plans} /></section>

      <section className="plantazConstruction" id="construction" aria-labelledby="plantaz-construction-title"><div className="plantazConstructionHeader"><p className="plantazEyebrow">Le projet</p><h2 id="plantaz-construction-title">Timeline de construction</h2><p>Les étapes présentées sont indicatives et seront précisées au fur et à mesure de l’avancement du projet.</p></div><div className="plantazConstructionList" role="list">{plantazConstructionTimeline.map((step, index) => <article className="plantazConstructionStep" key={step.title} role="listitem"><span className="plantazConstructionNumber">{String(index + 1).padStart(2, "0")}</span><div><span className="plantazConstructionDate">{step.date}</span><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div></section>

      <section className="plantazSection" id="gallery"><div className="plantazSectionIntro"><p className="plantazEyebrow">Galerie</p><h2>Le projet en images.</h2></div><PlantazGallery images={galleryImages} /></section>

      <PlantazAvailabilityExplorer imageUrl={heroImage?.url ?? null} />

      <section className="plantazContact" id="contact"><div><p className="plantazEyebrow">Votre intérêt</p><h2>Recevez les informations du projet.</h2><p>Une question sur l’appartement Plantaz ? Laissez vos coordonnées, nous vous répondrons rapidement.</p></div><PlantazContactForm /></section>

      <footer className="plantazFooter">
        <div className="plantazFooterGrid">
          <div className="plantazFooterBrand">
            <img src="/bs-logo-menu-white.png" alt="BrotherStudio" />
            <p>Visualisations architecturales et sites de vente pour projets immobiliers.</p>
          </div>
          <div className="plantazFooterColumn">
            <h3>Contact</h3>
            <a href="mailto:info@brotherstudio.ca">info@brotherstudio.ca</a>
            <a href="tel:+14376773212">+1 437 677 3212</a>
            <a href="https://www.instagram.com/brother_studio_canada" target="_blank" rel="noreferrer">Instagram ↗</a>
          </div>
          <div className="plantazFooterColumn">
            <h3>Entreprise</h3>
            <p>BrotherStudio Visualization</p>
            <p>87 Ashbury Blvrd<br />Ajax, L1Z 1N1<br />Canada</p>
            <p>Ontario Business Registration No. 1001633126</p>
          </div>
          <div className="plantazFooterColumn">
            <h3>Disponibilité</h3>
            <p>Lundi — vendredi<br />9 h — 17 h</p>
            <p>Sur rendez-vous</p>
            <a href="#top">Retour en haut ↑</a>
          </div>
        </div>
        <div className="plantazFooterBottom"><span>Plantaz · {address}</span><span>Un site de vente par BrotherStudio</span></div>
      </footer>
    </main>
  );
}
