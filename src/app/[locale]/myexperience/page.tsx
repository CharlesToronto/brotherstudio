import Link from "next/link";
import type { Metadata } from "next";
import { MyExperienceAmbientBlobs } from "@/components/MyExperienceAmbientBlobs";
import { MyExperienceCommunitySection } from "@/components/MyExperienceCommunitySection";
import { MyExperienceGalleryCarousel } from "@/components/MyExperienceGalleryCarousel";
import { MyExperienceGalleryModeToggle } from "@/components/MyExperienceGalleryModeToggle";
import { MyExperienceGalleryToneObserver } from "@/components/MyExperienceGalleryToneObserver";
import { MyExperienceHousePlanSection } from "@/components/MyExperienceHousePlanSection";
import { MyExperienceLocationSlideshow } from "@/components/MyExperienceLocationSlideshow";
import { MyExperienceParallaxHero } from "@/components/MyExperienceParallaxHero";
import { MyExperienceScrollProgress } from "@/components/MyExperienceScrollProgress";
import VerticalCarousel from "@/components/ui/demo";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getGalleryItems } from "@/lib/galleryStore";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

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
    alt: "Lifestyle and access slide 1",
  },
  {
    src: "/myexperience-lifestyle-slide-02.webp",
    alt: "Lifestyle and access slide 2",
  },
  {
    src: "/myexperience-lifestyle-slide-03.webp",
    alt: "Lifestyle and access slide 3",
  },
] as const;
const housePlanSpecs = [
  { id: "total-area", label: "Total area", value: "192 m²" },
  { id: "living-room", label: "Living room", value: "52 m²" },
  { id: "dining-room", label: "Dining room", value: "21 m²" },
] as const;

const communityItems = [
  {
    number: "01",
    title: "Appartment #1",
    description:
      "The main social level is organized around a 52 m² living room, a 21 m² dining area and direct extension to the 74 m² terrace, creating a hospitality-grade space for daily use and reception.",
    image: HOUSE_PLAN_SLIDES[0],
    size: "medium",
  },
  {
    number: "02",
    title: "Appartment #2",
    description:
      "The plan balances privacy and comfort with a 28 m² primary suite, 19 m² guest suites and carefully separated circulation so the residence feels calm, legible and sheltered from the public zones.",
    image: HOUSE_PLAN_SLIDES[1],
    size: "medium",
  },
  {
    number: "03",
    title: "Appartment #3",
    description:
      "Across 192 m², the layout is conceived as a hospitality-driven residence: generous common areas, layered thresholds, controlled sightlines and fluid transitions between interior warmth and the surrounding landscape.",
    image: HOUSE_PLAN_SLIDES[2],
    size: "medium",
  },
] as const;

const amenities = [
  { label: "Lakefront promenade", time: "4 min" },
  { label: "Private wellness club", time: "6 min" },
  { label: "Fine dining district", time: "8 min" },
  { label: "Downtown core", time: "12 min" },
] as const;
const propertyFacts = [
  { label: "Total area", value: "192 m²" },
  { label: "Living room", value: "52 m²" },
  { label: "Dining room", value: "21 m²" },
  { label: "Location", value: "Switzerland" },
  { label: "Format", value: "Private residence" },
] as const;
const storyHighlights = [
  {
    title: "Presence",
    description: "A residence composed to feel calm, private and immediately established in its setting.",
  },
  {
    title: "Light",
    description: "Glazing, circulation and interior tone are used to make every image read as warm and inhabited.",
  },
  {
    title: "Flow",
    description: "Transitions between shared rooms, sleeping areas and outdoor terraces stay fluid and legible.",
  },
] as const;

export async function generateMetadata({
  params,
}: MyExperiencePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/myexperience";

  return {
    title: "myExperience",
    description: "Immersive cinematic real estate presentation by BrotherStudio.",
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
  };
}

export default async function MyExperiencePage({ params }: MyExperiencePageProps) {
  const locale = await resolveLocaleParam(params);
  const mesangeGalleryImages = (await getGalleryItems())
    .filter((item) => item.project === "mesange")
    .map((item, index) => ({
      id: item.id,
      src: item.src,
      alt: item.architect?.trim() || `Mesange render ${index + 1}`,
    }));
  const mesangeExteriorImages = mesangeGalleryImages.filter((item) =>
    item.alt.toLowerCase().includes("exterior"),
  );

  return (
    <main className="myExperiencePage">
      <MyExperienceAmbientBlobs />
      <MyExperienceScrollProgress />
      <MyExperienceGalleryToneObserver />
      <MyExperienceParallaxHero heroImage={HERO_IMAGE} />

      <section className="myExperienceFactsSection" aria-label="Mesange property facts">
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
        <ScrollReveal as="section" className="myExperiencePanel myExperiencePlanSection">
          <MyExperienceHousePlanSection
            kicker="House Plan"
            title="HOUSE PLAN"
            specs={[...housePlanSpecs]}
            note="The spatial composition is conceived as a hospitality-grade residence, organized around light, privacy, indoor warmth and fluid transitions into landscape."
            defaultImage={{
              src: FLOORPLAN_IMAGE,
              alt: "Luxury residence floor plan",
            }}
          />
        </ScrollReveal>

        <MyExperienceCommunitySection
          kicker="House Plan"
          title="Let's have a look"
          description="A spatial reading of the residence, focused on scale, circulation and the balance between private retreat and shared living."
          items={[...communityItems]}
        />

        <section className="myExperienceExteriorSection" aria-label="Mesange exterior sequence">
          <div className="myExperienceExteriorGrid">
            <div className="myExperienceExteriorMedia">
              <VerticalCarousel images={mesangeExteriorImages} />
            </div>
            <div className="myExperienceExteriorCopy">
              <p className="myExperienceSectionKicker">Exterior Sequence</p>
              <h2 className="myExperienceSectionTitle">FIRST IMPRESSION</h2>
              <p className="myExperienceStoryText">
                The exterior renders define how Mesange is perceived before any plan,
                material note or interior perspective is introduced. The massing stays
                measured, the roofline remains quiet, and the glazing carries the warmth.
              </p>
              <p className="myExperienceStoryText">
                This sequence is meant to read as arrival, silhouette and atmosphere:
                a controlled architectural image that makes the residence feel composed,
                private and immediately legible in its landscape.
              </p>
            </div>
          </div>
        </section>

        <section className="myExperienceGallerySection" id="gallery">
          <div className="myExperienceGalleryHeadingRow">
            <div className="myExperienceSectionHeading">
              <p className="myExperienceSectionKicker">Visual Narrative</p>
              <h2 className="myExperienceSectionTitle">GALLERY</h2>
            </div>
            <MyExperienceGalleryModeToggle />
          </div>
          <div className="myExperienceGalleryCarouselFrame">
            <MyExperienceGalleryCarousel images={mesangeGalleryImages} />
          </div>
        </section>

        <section className="myExperienceLifestyleSection" id="location">
          <div className="myExperienceLifestyleGrid">
            <ScrollReveal as="article" className="myExperiencePanel myExperienceLifestyleCopy">
              <p className="myExperienceSectionKicker">Lifestyle / Location</p>
              <h2 className="myExperienceSectionTitle">LIFESTYLE & ACCESS</h2>
              <p className="myExperienceStoryText">
                Mesange is positioned to feel residential first: quiet, deliberate and connected
                to a daily rhythm built around walking distance amenities, landscape views and
                a restrained sense of exclusivity.
              </p>
              <p className="myExperienceStoryText">
                The project is framed not as an isolated object, but as part of a complete way of living:
                arrival, neighborhood atmosphere and immediate access to what matters most day to day.
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
              <p className="myExperienceSectionKicker">Access Views</p>
              <h3 className="myExperienceLifestyleVisualTitle">Daily context around the residence</h3>
              <div className="myExperienceMapCard">
                <MyExperienceLocationSlideshow slides={[...LIFESTYLE_ACCESS_SLIDES]} />
              </div>
            </ScrollReveal>
          </div>
        </section>

        <ScrollReveal as="section" className="myExperiencePanel myExperienceProjectStorySection">
          <div className="myExperienceProjectStoryIntro">
            <p className="myExperienceSectionKicker">Project Story</p>
            <h2 className="myExperienceSectionTitle">ARCHITECTURAL INTENT</h2>
            <p className="myExperienceStoryText">
              Mesange is imagined as a residence of presence rather than spectacle.
              The project is built around controlled proportions, interior warmth and a cinematic reading
              of domestic life that feels both refined and unforced.
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

        <ScrollReveal as="section" className="myExperiencePanel myExperienceFinalCta">
          <p className="myExperienceSectionKicker">Next Step</p>
          <h2 className="myExperienceFinalTitle">REQUEST THE COMPLETE CINEMATIC BROCHURE</h2>
          <p className="myExperienceFinalLead">
            Receive the full presentation package, floor plan set and guided overview of the project.
          </p>
          <div className="myExperienceFinalActions">
            <Link href={withLocalePath(locale, "/contact")} className="myExperiencePrimaryButton">
              Request brochure
            </Link>
            <Link href={withLocalePath(locale, "/price")} className="myExperienceGhostButton">
              View pricing
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </main>
  );
}
