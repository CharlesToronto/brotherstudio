import type { Metadata } from "next";

import { BackToTopButton } from "@/components/BackToTopButton";
import { CalendlyEmbed } from "@/components/CalendlyEmbed";
import { HomeBlurWordSection } from "@/components/HomeBlurWordSection";
import { HomeGalleryExperience } from "@/components/HomeGalleryExperience";
import { HomeHeroHeaderController } from "@/components/HomeHeroHeaderController";
import { TrustedCompanies } from "@/components/TrustedCompanies";
import { CALENDLY_MEETING_URL } from "@/lib/calendly";
import { getMessages } from "@/content/messages";
import { getGalleryItems } from "@/lib/galleryStore";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

export const revalidate = 3600;

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const pathname = "/";

  return {
    title: {
      absolute: messages.home.metadataTitle,
    },
    description: messages.home.metadataDescription,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title: messages.home.metadataTitle,
      description: messages.home.metadataDescription,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
    twitter: {
      title: messages.home.metadataTitle,
      description: messages.home.metadataDescription,
    },
  };
}

export default async function LocalizedHomePage({ params }: LocalePageProps) {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const items = await getGalleryItems();
  const bookingCopy =
    locale === "fr"
      ? {
          eyebrow: "Book a meeting",
          title: "Planifie un appel rapide.",
          text: "Bloque un creneau en ligne et recois automatiquement le lien Google Meet pour discuter de ton projet.",
          frameTitle: "Reservation Calendly BrotherStudio",
        }
      : {
          eyebrow: "Book a meeting",
          title: "Schedule a quick meeting.",
          text: "Pick a time online and automatically receive a Google Meet link to discuss your project.",
          frameTitle: "BrotherStudio Calendly booking",
        };

  return (
    <main className="siteMain">
      <HomeHeroHeaderController />
      <HomeBlurWordSection items={items} />
      <HomeGalleryExperience
        items={items}
        filterLabels={{
          all: messages.home.projectFilterAllLabel,
          ariaLabel: messages.home.projectFilterAriaLabel,
        }}
        sceneFilterLabels={{
          ariaLabel: messages.home.sceneFilterAriaLabel,
          all: messages.home.sceneFilterLabels.all,
          bedroom: messages.home.sceneFilterLabels.bedroom,
          livingRoom: messages.home.sceneFilterLabels.livingRoom,
          kitchen: messages.home.sceneFilterLabels.kitchen,
          exterior: messages.home.sceneFilterLabels.exterior,
          bathroom: messages.home.sceneFilterLabels.bathroom,
          focusAmbiance: messages.home.sceneFilterLabels.focusAmbiance,
        }}
      />
      <TrustedCompanies locale={locale} />
      <section className="homeBookingSection" aria-labelledby="homeBookingTitle">
        <div className="homeBookingIntro">
          <p>{bookingCopy.eyebrow}</p>
          <h2 id="homeBookingTitle">{bookingCopy.title}</h2>
          <span>{bookingCopy.text}</span>
        </div>
        <CalendlyEmbed title={bookingCopy.frameTitle} url={CALENDLY_MEETING_URL} />
      </section>
      <BackToTopButton
        label={messages.home.backToTopLabel}
        footerLabel={messages.home.backToFooterLabel}
      />
    </main>
  );
}
