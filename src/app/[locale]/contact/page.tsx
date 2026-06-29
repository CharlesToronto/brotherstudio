import type { Metadata } from "next";

import { CalendlyEmbed } from "@/components/CalendlyEmbed";
import { ContactForm } from "@/components/ContactForm";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getMessages } from "@/content/messages";
import { site } from "@/content/site";
import { CALENDLY_MEETING_URL } from "@/lib/calendly";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocaleContactPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const pathname = "/contact";

  return {
    title: messages.contact.title,
    description: messages.contact.metadataDescription,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title: messages.contact.title,
      description: messages.contact.metadataDescription,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
    twitter: {
      title: messages.contact.title,
      description: messages.contact.metadataDescription,
    },
  };
}

export default async function LocalizedContactPage({
  params,
}: LocaleContactPageProps) {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const contactCopy =
    locale === "fr"
      ? {
          eyebrow: "Contact",
          title: "Parlons de votre projet immobilier.",
          intro:
            "Envoyez vos plans, vos objectifs de vente ou une reference visuelle. Nous vous repondons avec la meilleure approche pour vos images, votre video ou votre site de vente.",
          highlights: ["Reponse sous 24h", "Plans PDF bienvenus", "Google Meet disponible"],
          directTitle: "Contact direct",
          directText:
            "Pour une demande precise, ajoutez le type de projet, le nombre d'images souhaitees et votre deadline.",
        }
      : {
          eyebrow: "Contact",
          title: "Let’s discuss your real estate project.",
          intro:
            "Send your plans, sales goals, or visual references. We will reply with the right approach for imagery, video, or a sales website.",
          highlights: ["Reply within 24h", "PDF plans welcome", "Google Meet available"],
          directTitle: "Direct contact",
          directText:
            "For a precise request, include the project type, image quantity, and your deadline.",
        };
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
    <main className="siteMain contactPageMain">
      <section className="contactPageStack">
        <ScrollReveal as="section" className="contactHero" aria-labelledby="contactTitle">
          <p className="contactHeroEyebrow">{contactCopy.eyebrow}</p>
          <h1 id="contactTitle" className="contactHeroTitle">
            {contactCopy.title}
          </h1>
          <p className="contactHeroIntro">{contactCopy.intro}</p>
          <div className="contactHeroHighlights" aria-label="Contact highlights">
            {contactCopy.highlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal
          as="section"
          className="contactLayout contactLayoutRefined"
          aria-labelledby="contactFormTitle"
          delay={80}
        >
          <div className="contactBlock contactFormPanel">
            <p className="contactPanelEyebrow">{messages.contact.title}</p>
            <h2 id="contactFormTitle" className="contactPanelTitle">
              {messages.contact.detailsTitle}
            </h2>
            <ContactForm messages={messages.contact.form} />
          </div>

          <aside className="contactBlock contactInfoPanel" aria-labelledby="contactDirectTitle">
            <p className="contactPanelEyebrow">{contactCopy.directTitle}</p>
            <h2 id="contactDirectTitle" className="contactPanelTitle">
              BrotherStudio
            </h2>
            <p className="contactInfoText">{contactCopy.directText}</p>
            <address className="contactText">
              {site.contact.addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
              <div className="contactSpacer" />
              <div>
                <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              </div>
              <div>
                <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>
              </div>
            </address>
          </aside>
        </ScrollReveal>

        <ScrollReveal
          as="section"
          className="homeBookingSection"
          aria-labelledby="contactBookingTitle"
          delay={140}
        >
          <div className="homeBookingIntro">
            <p>{bookingCopy.eyebrow}</p>
            <h2 id="contactBookingTitle">{bookingCopy.title}</h2>
            <span>{bookingCopy.text}</span>
          </div>
          <CalendlyEmbed title={bookingCopy.frameTitle} url={CALENDLY_MEETING_URL} />
        </ScrollReveal>
      </section>
    </main>
  );
}
