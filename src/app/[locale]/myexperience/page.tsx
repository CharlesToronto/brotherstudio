import Link from "next/link";
import type { Metadata } from "next";
import { MyExperienceAmbientBlobs } from "@/components/MyExperienceAmbientBlobs";
import { MyExperienceCommunitySection } from "@/components/MyExperienceCommunitySection";
import { MyExperienceExteriorWeather } from "@/components/MyExperienceExteriorWeather";
import { MyExperienceGalleryCarousel } from "@/components/MyExperienceGalleryCarousel";
import { MyExperienceGalleryHeading } from "@/components/MyExperienceGalleryHeading";
import { MyExperienceGalleryModeToggle } from "@/components/MyExperienceGalleryModeToggle";
import { MyExperienceGalleryToneObserver } from "@/components/MyExperienceGalleryToneObserver";
import { MyExperienceHousePlanSection } from "@/components/MyExperienceHousePlanSection";
import { MyExperienceLeadFooter } from "@/components/MyExperienceLeadFooter";
import { MyExperienceLocationSlideshow } from "@/components/MyExperienceLocationSlideshow";
import { MyExperienceParallaxHero } from "@/components/MyExperienceParallaxHero";
import { MyExperienceStickyNavObserver } from "@/components/MyExperienceStickyNavObserver";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";
import { buttonVariants } from "@/components/ui/button";
import VerticalCarousel from "@/components/ui/demo";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getGalleryItems } from "@/lib/galleryStore";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";
import { cn } from "@/lib/utils";

type MyExperiencePageProps = {
  params: Promise<{ locale: string }>;
};

const HERO_IMAGE = "/myexperience-hero-night.webp";
const HOUSE_PLAN_SLIDES = [
  "/myexperience-house-plan-02.png",
  "/myexperience-house-plan-01.png",
  "/myexperience-house-plan-03.png",
] as const;
const FLOORPLAN_IMAGE = "/myexperience-house-plan-sales-05.png";
const LIFESTYLE_ACCESS_IMAGE = "/myexperience-lifestyle-access-map.webp";
const LIFESTYLE_ACCESS_SLIDES = [
  {
    src: LIFESTYLE_ACCESS_IMAGE,
    alt: "Cadre de vie et accessibilite, vue 1",
  },
  {
    src: "/myexperience-lifestyle-slide-02.webp",
    alt: "Cadre de vie et accessibilite, vue 2",
  },
  {
    src: "/myexperience-lifestyle-slide-03.webp",
    alt: "Cadre de vie et accessibilite, vue 3",
  },
] as const;
const housePlanSpecs = [
  { id: "total-area", label: "Surface totale", value: "192 m²" },
  { id: "living-room", label: "Sejour", value: "52 m²" },
  { id: "dining-room", label: "Salle a manger", value: "21 m²" },
] as const;

const communityItems = [
  {
    number: "01",
    title: "Appartement 1",
    description:
      "Le niveau principal s'organise autour d'un sejour de 52 m², d'une salle a manger de 21 m² et d'une extension directe vers la terrasse de 74 m², pour un espace de vie genereux et accueillant au quotidien.",
    image: HOUSE_PLAN_SLIDES[0],
    size: "medium",
  },
  {
    number: "02",
    title: "Appartement 2",
    description:
      "Le plan equilibre intimite et confort avec une suite principale de 28 m², des chambres invites de 19 m² et une circulation soigneusement separee pour une residence calme et lisible.",
    image: HOUSE_PLAN_SLIDES[1],
    size: "medium",
  },
  {
    number: "03",
    title: "Appartement 3",
    description:
      "Sur 192 m², l'agencement est pense comme une residence d'exception: de beaux espaces communs, des transitions fluides et une relation naturelle entre la chaleur interieure et le paysage environnant.",
    image: HOUSE_PLAN_SLIDES[2],
    size: "medium",
  },
] as const;

const amenities = [
  { label: "Promenade au bord du lac", time: "4 min" },
  { label: "Club wellness prive", time: "6 min" },
  { label: "Quartier de restaurants", time: "8 min" },
  { label: "Centre-ville", time: "12 min" },
] as const;
const propertyFacts = [
  { label: "3 lots", value: "135-185 m²" },
  { label: "Caracteristiques", value: "Calme & familial" },
  { label: "Prix", value: "Dès CHF 867'000" },
  { label: "Localisation", value: "Gland, VD" },
] as const;
const storyHighlights = [
  {
    title: "Presence",
    description: "Une residence composee pour offrir une sensation immediate de calme, d'intimite et d'ancrage dans son environnement.",
  },
  {
    title: "Lumiere",
    description: "Les ouvertures, la circulation et les tonalites interieures sont pensees pour rendre chaque espace chaleureux et habite.",
  },
  {
    title: "Fluidite",
    description: "Les transitions entre les espaces de vie, les zones nuit et les terrasses exterieures restent fluides et naturelles.",
  },
] as const;

export async function generateMetadata({
  params,
}: MyExperiencePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/myexperience";

  return {
    title: "myExperience",
    description: "Presentation immobiliere cinematographique immersive par BrotherStudio.",
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
  };
}

export default async function MyExperiencePage({ params }: MyExperiencePageProps) {
  const locale = await resolveLocaleParam(params);
  const sectionLinks = [
    { href: "#overview", label: "Apercu" },
    { href: "#plan", label: "Plan" },
    { href: "#exterieur", label: "Exterieur" },
    { href: "#gallery", label: "Galerie" },
    { href: "#location", label: "Localisation" },
    { href: "#vision", label: "Vision" },
    { href: "#brochure", label: "Brochure" },
  ] as const;
  const mesangeGalleryImages = (await getGalleryItems())
    .filter((item) => item.project === "mesange")
    .map((item, index) => ({
      id: item.id,
      src: item.src,
      alt: item.architect?.trim() || `Rendu Mesange ${index + 1}`,
    }));
  const mesangeExteriorImages = mesangeGalleryImages.filter((item) =>
    item.alt.toLowerCase().includes("exterior"),
  );

  return (
    <main className="myExperiencePage" data-hero-visible="true">
      <MyExperienceAmbientBlobs />
      <MyExperienceGalleryToneObserver />
      <MyExperienceStickyNavObserver />
      <MyExperienceParallaxHero heroImage={HERO_IMAGE} />

      <div className="myExperienceStickyNavWrap">
        <nav className="myExperienceStickyNav" aria-label="Navigation de la page">
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "myExperienceStickyNavLink",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <section className="myExperienceFactsSection" aria-label="Informations cles sur Mesange">
        <div className="myExperienceShell">
          <div className="myExperienceFactsGrid">
            {propertyFacts.map((fact, index) => (
              <ScrollReveal
                key={fact.label}
                as="article"
                className="myExperienceFactCard"
                delay={index * 60}
              >
                <p className="myExperienceFactLabel">{fact.label}</p>
                <p className="myExperienceFactValue">{fact.value}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="myExperienceShell myExperienceSections" id="overview">
        <ScrollReveal as="section" id="plan" className="myExperiencePanel myExperiencePlanSection">
          <MyExperienceHousePlanSection
            kicker="Plan"
            title="PLAN"
            specs={[...housePlanSpecs]}
            note="La composition des espaces est pensee comme une residence de standing, organisee autour de la lumiere, de l'intimite, du confort interieur et de transitions fluides vers le paysage."
            defaultImage={{
              src: FLOORPLAN_IMAGE,
              alt: "Plan de la residence",
            }}
          />
        </ScrollReveal>

        <MyExperienceCommunitySection
          kicker="Plan"
          title="Decouvrons les espaces"
          description="Une lecture spatiale de la residence, axee sur les volumes, la circulation et l'equilibre entre intimite et vie partagee."
          items={[...communityItems]}
        />

        <section
          id="exterieur"
          className="myExperienceExteriorSection"
          aria-label="Sequence exterieure de Mesange"
        >
          <div className="myExperienceExteriorGrid">
            <div className="myExperienceExteriorMedia">
              <VerticalCarousel images={mesangeExteriorImages} />
            </div>
            <div className="myExperienceExteriorCopy">
              <p className="myExperienceSectionKicker">Around me</p>
              <h2 className="myExperienceSectionTitle">AUTOUR DE MOI</h2>
              <p className="myExperienceStoryText">
                Les rendus exterieurs definissent la perception de Mesange avant meme la lecture du plan,
                des materiaux ou des perspectives interieures. Les volumes restent maitrises,
                la ligne de toiture demeure sobre et les ouvertures portent la chaleur du projet.
              </p>
              <p className="myExperienceStoryText">
                Cette sequence est pensee comme une arrivee, une silhouette et une atmosphere:
                une image architecturale maitrisee qui rend la residence lisible, privee
                et immediatement ancree dans son paysage.
              </p>
              <MyExperienceExteriorWeather />
            </div>
          </div>
        </section>

        <section className="myExperienceGallerySection" id="gallery">
          <div className="myExperienceGalleryHeadingRow">
            <MyExperienceGalleryHeading
              kicker="Narration visuelle"
              title="GALERIE"
            />
            <div className="myExperienceGalleryHeadingControls">
              <MyExperienceGalleryModeToggle />
            </div>
          </div>
          <div className="myExperienceGalleryCarouselFrame">
            <MyExperienceGalleryCarousel images={mesangeGalleryImages} />
          </div>
        </section>

        <section className="myExperienceLifestyleSection" id="location">
          <div className="myExperienceLifestyleGrid">
            <ScrollReveal as="article" className="myExperiencePanel myExperienceLifestyleCopy">
              <p className="myExperienceSectionKicker">Cadre de vie / Localisation</p>
              <h2 className="myExperienceSectionTitle">CADRE DE VIE & ACCES</h2>
              <p className="myExperienceStoryText">
                Mesange privilegie avant tout une qualite residentielle: un cadre calme, maitrise
                et connecte a un quotidien rythme par les commodites accessibles a pied,
                les vues paysagees et une exclusivite discrete.
              </p>
              <p className="myExperienceStoryText">
                Le projet n&apos;est pas pense comme un objet isole, mais comme une maniere complete d&apos;habiter:
                l&apos;arrivee, l&apos;ambiance du quartier et l&apos;acces immediat a l&apos;essentiel au quotidien.
              </p>
              <div className="myExperienceAmenityList">
                {amenities.map((amenity) => (
                  <div key={amenity.label} className="myExperienceAmenityRow">
                    <span>{amenity.label}</span>
                    <span>{amenity.time}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal as="article" className="myExperiencePanel myExperienceStoryCard" delay={90}>
              <p className="myExperienceSectionKicker">Vues d&apos;acces</p>
              <h3 className="myExperienceLifestyleVisualTitle">Le contexte quotidien autour de la residence</h3>
              <div className="myExperienceMapCard">
                <MyExperienceLocationSlideshow slides={[...LIFESTYLE_ACCESS_SLIDES]} />
              </div>
            </ScrollReveal>
          </div>
        </section>

        <ScrollReveal as="section" id="vision" className="myExperiencePanel myExperienceProjectStorySection">
          <div className="myExperienceProjectStoryIntro">
            <p className="myExperienceSectionKicker">Vision du projet</p>
            <h2 className="myExperienceSectionTitle">INTENTION ARCHITECTURALE</h2>
              <p className="myExperienceStoryText">
                Mesange est imaginee comme une residence de presence plutot que de spectacle.
                Le projet s&apos;appuie sur des proportions maitrisees, une chaleur interieure
                et une lecture cinematographique de l&apos;habitat, a la fois raffinee et naturelle.
              </p>
          </div>

          <div className="myExperienceProjectStoryHighlights">
            {storyHighlights.map((highlight, index) => (
              <ScrollReveal
                key={highlight.title}
                as="article"
                className="myExperienceProjectStoryCard"
                delay={80 + index * 70}
              >
                <p className="myExperienceProjectStoryCardTitle">{highlight.title}</p>
                <p className="myExperienceStoryText">{highlight.description}</p>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal as="section" id="brochure" className="myExperiencePanel myExperienceFinalCta">
          <p className="myExperienceSectionKicker">Prochaine etape</p>
          <h2 className="myExperienceFinalTitle">DEMANDEZ LA BROCHURE CINEMATOGRAPHIQUE COMPLETE</h2>
          <p className="myExperienceFinalLead">
            Recevez la presentation complete, les plans et un apercu guide du projet.
          </p>
          <div className="myExperienceFinalActions">
            <Link
              href={withLocalePath(locale, "/contact")}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "myExperiencePrimaryButton",
              )}
            >
              Demander la brochure
            </Link>
            <Link
              href={withLocalePath(locale, "/price")}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "myExperienceGhostButton",
              )}
            >
              Voir les prix
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal as="section" id="assistant" className="myExperiencePanel" delay={80}>
          <AnimatedAIChat />
        </ScrollReveal>

      </div>

      <MyExperienceLeadFooter />
    </main>
  );
}
