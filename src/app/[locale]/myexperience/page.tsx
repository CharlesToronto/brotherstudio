import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";

import { MyExperienceCommunitySection } from "@/components/MyExperienceCommunitySection";
import { MyExperienceGalleryCarousel } from "@/components/MyExperienceGalleryCarousel";
import { MyExperienceGalleryModeToggle } from "@/components/MyExperienceGalleryModeToggle";
import { MyExperienceGalleryToneObserver } from "@/components/MyExperienceGalleryToneObserver";
import { MyExperienceHousePlanSection } from "@/components/MyExperienceHousePlanSection";
import { MyExperienceLocationSlideshow } from "@/components/MyExperienceLocationSlideshow";
import { MyExperienceScrollProgress } from "@/components/MyExperienceScrollProgress";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getGalleryItems } from "@/lib/galleryStore";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type MyExperiencePageProps = {
  params: Promise<{ locale: string }>;
};

const HERO_IMAGE = "/myexperience-hero-night.png";
const SERVICE_IMAGES = [
  "/myexperience-community-01.png",
  "/myexperience-community-02.png",
  "/myexperience-community-03.png",
  "/myexperience-community-04.png",
] as const;
const FLOORPLAN_IMAGE = "/myexperience-floorplan-mesange.png";
const LIFESTYLE_ACCESS_IMAGE = "/myexperience-lifestyle-access-map.png";
const LIFESTYLE_ACCESS_SLIDES = [
  {
    src: LIFESTYLE_ACCESS_IMAGE,
    alt: "Lifestyle and access slide 1",
  },
  {
    src: "/myexperience-lifestyle-slide-02.png",
    alt: "Lifestyle and access slide 2",
  },
  {
    src: "/myexperience-lifestyle-slide-03.png",
    alt: "Lifestyle and access slide 3",
  },
] as const;
const housePlanSpecs = [
  { id: "total-area", label: "Total area", value: "192 m²" },
  { id: "living-room", label: "Living room", value: "52 m²" },
  { id: "dining-room", label: "Dining room", value: "21 m²" },
  { id: "primary-suite", label: "Primary suite", value: "28 m²" },
  { id: "guest-suites", label: "Guest suites", value: "19 m²" },
  { id: "terrace-pool", label: "Terrace + pool", value: "74 m²" },
] as const;

const communityItems = [
  {
    number: "01",
    title: "Fondue Nights",
    description: "Warm alpine tables, shared rituals and the kind of hospitality that turns the village into a lived experience.",
    image: SERVICE_IMAGES[0],
    size: "narrow",
  },
  {
    number: "02",
    title: "Alpine Panorama",
    description: "Wide mountain views and village rooftops frame the project within a dramatic Swiss landscape.",
    image: SERVICE_IMAGES[1],
    size: "medium",
  },
  {
    number: "03",
    title: "Local Matchday",
    description: "Daily life extends beyond the chalet with sports, open air activity and a visible sense of community.",
    image: SERVICE_IMAGES[2],
    size: "medium",
  },
  {
    number: "04",
    title: "Village Walks",
    description: "Pedestrian streets, timber facades and mountain air create a slower rhythm around the residence.",
    image: SERVICE_IMAGES[3],
    size: "narrow",
  },
  {
    number: "05",
    title: "Summit Outlooks",
    description: "Open viewpoints and elevated routes keep the village tied to a broader alpine panorama throughout the day.",
    image: SERVICE_IMAGES[1],
    size: "narrow",
  },
  {
    number: "06",
    title: "Slow Routes",
    description: "On-foot connections between homes, restaurants and trails make the setting feel intimate rather than resort-like.",
    image: SERVICE_IMAGES[3],
    size: "narrow",
  },
] as const;

const amenities = [
  { label: "Lakefront promenade", time: "4 min" },
  { label: "Private wellness club", time: "6 min" },
  { label: "Fine dining district", time: "8 min" },
  { label: "Downtown core", time: "12 min" },
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

  return (
    <main className="myExperiencePage">
      <div className="myExperienceAmbient" aria-hidden="true">
        <span className="myExperienceAmbientSpot myExperienceAmbientSpot1" />
        <span className="myExperienceAmbientSpot myExperienceAmbientSpot2" />
        <span className="myExperienceAmbientSpot myExperienceAmbientSpot3" />
      </div>
      <MyExperienceScrollProgress />
      <MyExperienceGalleryToneObserver />
      <section className="myExperienceHero">
        <Image
          src={HERO_IMAGE}
          alt="Luxury architectural exterior render"
          fill
          priority
          sizes="100vw"
          className="myExperienceHeroImage"
        />
        <div className="myExperienceHeroOverlay" />
        <div className="myExperienceShell">
          <ScrollReveal as="div" className="myExperienceHeroCard">
            <nav className="myExperienceNav" aria-label="myExperience navigation">
              <Link href="#overview">Overview</Link>
              <Link href="#services">Community</Link>
              <Link href="#gallery">Gallery</Link>
              <Link href="#location">Location</Link>
            </nav>
            <p className="myExperienceEyebrow">Cinematic Residential Presentation</p>
            <h1 className="myExperienceHeroTitle">MESANGE</h1>
            <p className="myExperienceHeroCopy">
              A private modern residence shaped as an emotional architectural story,
              balancing calm landscape views, warm interior light and refined urban living.
            </p>
            <div className="myExperienceHeroMeta">
              <span>Mesange, Gland / Suisse</span>
              <span>Private Estate / 2026</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="myExperienceShell myExperienceSections" id="overview">
        <MyExperienceCommunitySection
          kicker="Advanced living tools"
          title="Its Just The Mood."
          description=""
          items={[...communityItems]}
        />

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

        <section className="myExperienceGallerySection" id="gallery">
          <div className="myExperienceGalleryHeadingRow">
            <div className="myExperienceSectionHeading">
              <ScrollReveal as="p" className="myExperienceSectionKicker">
                Visual Narrative
              </ScrollReveal>
              <ScrollReveal as="h2" className="myExperienceSectionTitle" delay={50}>
                GALLERY
              </ScrollReveal>
            </div>
            <ScrollReveal as="div" delay={90}>
              <MyExperienceGalleryModeToggle />
            </ScrollReveal>
          </div>
          <ScrollReveal as="div" delay={120}>
            <MyExperienceGalleryCarousel images={mesangeGalleryImages} />
          </ScrollReveal>
        </section>

        <section className="myExperienceStoryGrid">
          <ScrollReveal as="article" className="myExperiencePanel myExperienceStoryCard">
            <p className="myExperienceSectionKicker">Project Story</p>
            <h2 className="myExperienceSectionTitle">ARCHITECTURAL PHILOSOPHY</h2>
            <p className="myExperienceStoryText">
              Mesange is imagined as a residence of presence rather than spectacle.
              The massing stays restrained, while the experience unfolds through warm interior glow,
              crisp material contrast and carefully framed openings toward the landscape.
            </p>
            <p className="myExperienceStoryText">
              Every rendered perspective is composed to communicate calm, status and daily comfort.
              The project is not presented as a product sheet, but as an atmosphere to inhabit.
            </p>
          </ScrollReveal>

          <ScrollReveal
            as="article"
            className="myExperiencePanel myExperienceStoryCard"
            id="location"
            delay={80}
          >
            <p className="myExperienceSectionKicker">Location</p>
            <h2 className="myExperienceSectionTitle">LIFESTYLE & ACCESS</h2>
            <div className="myExperienceMapCard">
              <MyExperienceLocationSlideshow slides={[...LIFESTYLE_ACCESS_SLIDES]} />
            </div>
            <div className="myExperienceAmenityList">
              {amenities.map((amenity) => (
                <div key={amenity.label} className="myExperienceAmenityRow">
                  <span>{amenity.label}</span>
                  <span>{amenity.time}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        <ScrollReveal as="section" className="myExperienceFinalCta">
          <p className="myExperienceSectionKicker">Next Step</p>
          <h2 className="myExperienceFinalTitle">
            Request the complete cinematic brochure and private presentation package.
          </h2>
          <div className="myExperienceFinalActions">
            <Link href={withLocalePath(locale, "/contact")} className="myExperiencePrimaryButton">
              Contact BrotherStudio
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
