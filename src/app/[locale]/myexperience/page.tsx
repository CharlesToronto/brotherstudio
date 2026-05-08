import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";

import { ScrollReveal } from "@/components/ScrollReveal";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type MyExperiencePageProps = {
  params: Promise<{ locale: string }>;
};

const HERO_IMAGE = "/uploads/e04f9a62-980f-4650-a5fc-b754dcc16435-1775053117422.jpeg";
const SERVICE_IMAGES = [
  "/myexperience-community-01.png",
  "/myexperience-community-02.png",
  "/myexperience-community-03.png",
  "/myexperience-community-04.png",
] as const;
const GALLERY_IMAGES = [
  {
    src: "/uploads/9a18a588-da54-48b3-987a-3809a86b91b0-1773938014771.png",
    width: 1024,
    height: 768,
  },
  {
    src: "/uploads/7ed9ad20-4238-45f8-be89-d937f2ce9dcf-1773938060753.png",
    width: 1024,
    height: 768,
  },
  {
    src: "/uploads/d319f063-7b8b-41b2-857c-471d64d9083c-1774016140036.jpg",
    width: 5120,
    height: 3840,
  },
  {
    src: "/uploads/afc57519-61e4-4225-bb43-8cdc51125275-1774016096392.jpg",
    width: 5120,
    height: 3840,
  },
  {
    src: "/uploads/03315390-9045-44d2-9845-6f3c5783dc32-1774037083611.jpg",
    width: 5120,
    height: 3840,
  },
] as const;
const FLOORPLAN_IMAGE = "/myexperience-floorplan-gpt.png";
const LIFESTYLE_ACCESS_IMAGE = "/myexperience-lifestyle-access-map.png";

const services = [
  {
    number: "01",
    title: "Fondue Nights",
    description: "Warm alpine tables, shared rituals and the kind of hospitality that turns the village into a lived experience.",
    image: SERVICE_IMAGES[0],
  },
  {
    number: "02",
    title: "Alpine Panorama",
    description: "Wide mountain views and village rooftops frame the project within a dramatic Swiss landscape.",
    image: SERVICE_IMAGES[1],
  },
  {
    number: "03",
    title: "Local Matchday",
    description: "Daily life extends beyond the chalet with sports, open air activity and a visible sense of community.",
    image: SERVICE_IMAGES[2],
  },
  {
    number: "04",
    title: "Village Walks",
    description: "Pedestrian streets, timber facades and mountain air create a slower rhythm around the residence.",
    image: SERVICE_IMAGES[3],
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

  return (
    <main className="myExperiencePage">
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
            <h1 className="myExperienceHeroTitle">AURELIA HOUSE</h1>
            <p className="myExperienceHeroCopy">
              A private modern residence shaped as an emotional architectural story,
              balancing calm landscape views, warm interior light and refined urban living.
            </p>
            <div className="myExperienceHeroMeta">
              <span>Toronto, Canada</span>
              <span>Private Estate / 2026</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="myExperienceShell myExperienceSections" id="overview">
        <ScrollReveal as="section" className="myExperiencePanel" id="services">
          <div className="myExperienceSectionHeading">
            <p className="myExperienceSectionKicker">Daily Life</p>
            <h2 className="myExperienceSectionTitle">IN THE COMMUNITY</h2>
          </div>
          <div className="myExperienceServiceGrid">
            {services.map((service, index) => (
              <ScrollReveal
                key={service.number}
                as="article"
                className="myExperienceServiceCard"
                delay={index * 60}
              >
                <div className="myExperienceServiceMedia">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 900px) 100vw, 25vw"
                    className="myExperienceServiceImage"
                  />
                </div>
                <div className="myExperienceServiceBody">
                  <p className="myExperienceServiceNumber">{service.number}</p>
                  <h3 className="myExperienceServiceTitle">{service.title}</h3>
                  <p className="myExperienceServiceText">{service.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal as="section" className="myExperiencePanel myExperiencePlanSection">
          <div className="myExperiencePlanCopy">
            <p className="myExperienceSectionKicker">House Plan</p>
            <h2 className="myExperienceSectionTitle">HOUSE PLAN</h2>
            <dl className="myExperienceSpecs">
              <div><dt>Total area</dt><dd>192 m²</dd></div>
              <div><dt>Living room</dt><dd>52 m²</dd></div>
              <div><dt>Dining room</dt><dd>21 m²</dd></div>
              <div><dt>Primary suite</dt><dd>28 m²</dd></div>
              <div><dt>Guest suites</dt><dd>19 m²</dd></div>
              <div><dt>Terrace + pool</dt><dd>74 m²</dd></div>
            </dl>
            <p className="myExperiencePlanNote">
              The spatial composition is conceived as a hospitality-grade residence,
              organized around light, privacy, indoor warmth and fluid transitions into landscape.
            </p>
          </div>
          <div className="myExperiencePlanVisual">
            <div className="myExperiencePlanImageFrame">
              <Image
                src={FLOORPLAN_IMAGE}
                alt="Luxury residence floor plan"
                width={1198}
                height={1313}
                sizes="(max-width: 980px) 100vw, 50vw"
                className="myExperiencePlanImage"
              />
            </div>
          </div>
        </ScrollReveal>

        <section className="myExperienceGallerySection" id="gallery">
          <div className="myExperienceSectionHeading">
            <ScrollReveal as="p" className="myExperienceSectionKicker">
              Visual Narrative
            </ScrollReveal>
            <ScrollReveal as="h2" className="myExperienceSectionTitle" delay={50}>
              GALLERY
            </ScrollReveal>
          </div>
          <div className="myExperienceGalleryGrid">
            {GALLERY_IMAGES.map((image, index) => (
              <ScrollReveal
                key={image.src}
                as="figure"
                className={`myExperienceGalleryCard myExperienceGalleryCard${index + 1}`}
                delay={index * 45}
              >
                <Image
                  src={image.src}
                  alt={`Architectural render ${index + 1}`}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="myExperienceGalleryImage"
                />
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section className="myExperienceStoryGrid">
          <ScrollReveal as="article" className="myExperiencePanel myExperienceStoryCard">
            <p className="myExperienceSectionKicker">Project Story</p>
            <h2 className="myExperienceSectionTitle">ARCHITECTURAL PHILOSOPHY</h2>
            <p className="myExperienceStoryText">
              Aurelia House is imagined as a residence of presence rather than spectacle.
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
            <div className="myExperienceMapCard" aria-hidden="true">
              <Image
                src={LIFESTYLE_ACCESS_IMAGE}
                alt="Lifestyle and access map"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className="myExperienceMapImage"
              />
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
