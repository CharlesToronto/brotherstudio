import Link from "next/link";
import type { Metadata } from "next";
import { MyExperienceAmbientBlobs } from "@/components/MyExperienceAmbientBlobs";
import { MyExperienceCommunitySection } from "@/components/MyExperienceCommunitySection";
import { MyExperienceExteriorWeather } from "@/components/MyExperienceExteriorWeather";
import { MyExperienceGalleryCarousel } from "@/components/MyExperienceGalleryCarousel";
import { MyExperienceGalleryHeading } from "@/components/MyExperienceGalleryHeading";
import { MyExperienceGalleryToneObserver } from "@/components/MyExperienceGalleryToneObserver";
import { MyExperienceHousePlanSection } from "@/components/MyExperienceHousePlanSection";
import { MyExperienceLeadFooter } from "@/components/MyExperienceLeadFooter";
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
  "/myexperience-house-plan-02.webp",
  "/myexperience-house-plan-01.webp",
  "/myexperience-house-plan-03.webp",
] as const;
const FLOORPLAN_IMAGE = "/myexperience-house-plan-sales-05.webp";
const LIFESTYLE_ACCESS_SLIDES = [
  {
    src: "/myexperience-lifestyle-forest-malagnou.webp",
    alt: "Cadre de vie et accessibilité, sentier forestier de Malagnou",
  },
  {
    src: "/myexperience-lifestyle-lakeside-evening.webp",
    alt: "Cadre de vie et accessibilité, animation au bord du lac au coucher du soleil",
  },
  {
    src: "/myexperience-lifestyle-golf-view.webp",
    alt: "Cadre de vie et accessibilité, vue aérienne sur le golf et le lac",
  },
  {
    src: "/myexperience-lifestyle-street-sunset.webp",
    alt: "Cadre de vie et accessibilité, rue résidentielle au coucher du soleil",
  },
] as const;
const housePlanSpecs = [
  { id: "total-area", label: "Surface totale", value: "192 m²" },
  { id: "living-room", label: "Séjour", value: "52 m²" },
  { id: "dining-room", label: "Salle à manger", value: "21 m²" },
] as const;

const communityItems = [
  {
    number: "01",
    title: "Appartement 1",
    description:
      "Le niveau principal s’organise autour d’un séjour de 52 m², d’une salle à manger de 21 m² et d’une extension directe vers la terrasse de 74 m², pour un espace de vie généreux et accueillant au quotidien.",
    image: HOUSE_PLAN_SLIDES[0],
    size: "medium",
  },
  {
    number: "02",
    title: "Appartement 2",
    description:
      "Le plan équilibre intimité et confort avec une suite principale de 28 m², des chambres d’invités de 19 m² et une circulation soigneusement séparée pour une résidence calme et lisible.",
    image: HOUSE_PLAN_SLIDES[1],
    size: "medium",
  },
  {
    number: "03",
    title: "Appartement 3",
    description:
      "Sur 192 m², l’agencement est pensé comme une résidence d’exception : de beaux espaces communs, des transitions fluides et une relation naturelle entre la chaleur intérieure et le paysage environnant.",
    image: HOUSE_PLAN_SLIDES[2],
    size: "medium",
  },
] as const;

const propertyFacts = [
  { label: "3 lots", value: "135-185 m²" },
  { label: "Caractéristiques", value: "Calme & familial" },
  { label: "Prix", value: "Dès CHF 867'000" },
  { label: "Localisation", value: "Gland, VD" },
] as const;
const storyHighlights = [
  {
    title: "Présence",
    description: "Une résidence composée pour offrir une sensation immédiate de calme, d’intimité et d’ancrage dans son environnement.",
  },
  {
    title: "Lumière",
    description: "Les ouvertures, la circulation et les tonalités intérieures sont pensées pour rendre chaque espace chaleureux et habité.",
  },
  {
    title: "Fluidité",
    description: "Les transitions entre les espaces de vie, les zones nuit et les terrasses extérieures restent fluides et naturelles.",
  },
] as const;

export async function generateMetadata({
  params,
}: MyExperiencePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/myexperience";

  return {
    title: "myExperience",
    description: "Présentation immobilière cinématographique immersive par BrotherStudio.",
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
  };
}

export default async function MyExperiencePage({ params }: MyExperiencePageProps) {
  const locale = await resolveLocaleParam(params);
  const sectionLinks = [
    { href: "#overview", label: "Aperçu" },
    { href: "#plan", label: "Plan" },
    { href: "#exterieur", label: "Extérieur" },
    { href: "#gallery", label: "Galerie" },
    { href: "#vision", label: "Vision" },
    { href: "#brochure", label: "Brochure" },
  ] as const;
  const mesangeGalleryImages = (await getGalleryItems())
    .filter((item) => item.project === "mesange")
    .map((item, index) => ({
      id: item.id,
      src: item.src,
        alt: item.architect?.trim() || `Rendu Mésange ${index + 1}`,
    }));
  const aroundMeImages = [...LIFESTYLE_ACCESS_SLIDES];

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

      <section className="myExperienceFactsSection" aria-label="Informations clés sur Mésange">
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
            note="La composition des espaces est pensée comme une résidence de standing, organisée autour de la lumière, de l’intimité, du confort intérieur et de transitions fluides vers le paysage."
            defaultImage={{
              src: FLOORPLAN_IMAGE,
              alt: "Plan de la résidence",
            }}
          />
        </ScrollReveal>

        <MyExperienceCommunitySection
          kicker="Plan"
          title="Découvrons les espaces"
          description="Une lecture spatiale de la résidence, axée sur les volumes, la circulation et l’équilibre entre intimité et vie partagée."
          items={[...communityItems]}
        />

        <section
          id="exterieur"
          className="myExperienceExteriorSection"
          aria-label="Séquence extérieure de Mésange"
        >
          <div className="myExperienceExteriorGrid">
            <div className="myExperienceExteriorMedia">
              <VerticalCarousel images={aroundMeImages} />
            </div>
            <div className="myExperienceExteriorCopy">
              <p className="myExperienceSectionKicker">Around me</p>
              <h2 className="myExperienceSectionTitle">AUTOUR DE MOI</h2>
              <p className="myExperienceStoryText">
                Autour de Mésange, le quotidien s&apos;ouvre sur l&apos;espace forestier de Malagnou,
                la plage, le club de golf et des rues résidentielles paisibles. Le cadre
                combine une présence naturelle forte, des lieux de détente accessibles et
                une atmosphère de quartier calme.
              </p>
              <p className="myExperienceStoryText">
                Cette sélection présente seulement quelques repères du cadre de vie :
                les environs offrent encore bien plus à découvrir, entre promenades,
                loisirs, vues ouvertes et proximité du lac. Mésange s&apos;inscrit ainsi dans
                un environnement complet, agréable à vivre au quotidien.
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
          </div>
          <div className="myExperienceGalleryCarouselFrame">
            <MyExperienceGalleryCarousel images={mesangeGalleryImages} />
          </div>
        </section>

        <ScrollReveal as="section" id="vision" className="myExperiencePanel myExperienceProjectStorySection">
          <div className="myExperienceProjectStoryIntro">
            <p className="myExperienceSectionKicker">Vision du projet</p>
            <h2 className="myExperienceSectionTitle">INTENTION ARCHITECTURALE</h2>
              <p className="myExperienceStoryText">
                Mésange est imaginée comme une résidence de présence plutôt que de spectacle.
                Le projet s&apos;appuie sur des proportions maîtrisées, une chaleur intérieure
                et une lecture cinématographique de l&apos;habitat, à la fois raffinée et naturelle.
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
          <p className="myExperienceSectionKicker">Prochaine étape</p>
          <h2 className="myExperienceFinalTitle">DEMANDEZ LA BROCHURE CINÉMATOGRAPHIQUE COMPLÈTE</h2>
          <p className="myExperienceFinalLead">
            Recevez la présentation complète, les plans et un aperçu guidé du projet.
          </p>
          <div className="myExperienceFinalActions">
            <Link
              href="#contact"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "myExperiencePrimaryButton",
              )}
            >
              Demander la brochure
            </Link>
            <Link
              href="#contact"
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
