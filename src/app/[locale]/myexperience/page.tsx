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
const LIFESTYLE_ACCESS_SLIDES = [
  {
    src: "/myexperience-lifestyle-forest-malagnou.png",
    alt: "Cadre de vie et accessibilite, sentier forestier de Malagnou",
  },
  {
    src: "/myexperience-lifestyle-lakeside-evening.png",
    alt: "Cadre de vie et accessibilite, animation au bord du lac au coucher du soleil",
  },
  {
    src: "/myexperience-lifestyle-golf-view.png",
    alt: "Cadre de vie et accessibilite, vue aerienne sur le golf et le lac",
  },
  {
    src: "/myexperience-lifestyle-street-sunset.png",
    alt: "Cadre de vie et accessibilite, rue residentielle au coucher du soleil",
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
              <VerticalCarousel images={aroundMeImages} />
            </div>
            <div className="myExperienceExteriorCopy">
              <p className="myExperienceSectionKicker">Around me</p>
              <h2 className="myExperienceSectionTitle">AUTOUR DE MOI</h2>
              <p className="myExperienceStoryText">
                Autour de Mesange, le quotidien s&apos;ouvre sur l&apos;espace forestier de Malagny,
                la plage, le club de golf et des rues residentielles paisibles. Le cadre
                combine une presence naturelle forte, des lieux de detente accessibles et
                une atmosphere de quartier calme.
              </p>
              <p className="myExperienceStoryText">
                Cette selection presente seulement quelques reperes du cadre de vie:
                les environs offrent encore bien plus a decouvrir, entre promenades,
                loisirs, vues ouvertes et proximite du lac. Mesange s&apos;inscrit ainsi dans
                un environnement complet, agreable a vivre au quotidien.
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
