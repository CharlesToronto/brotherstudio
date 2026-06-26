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
  const bookingCopy =
    locale === "fr"
      ? {
          eyebrow: "Book a meeting",
          title: "Reserve un appel Google Meet.",
          text: "Choisis un creneau disponible. Le rendez-vous est ajoute au calendrier avec le lien Google Meet cree automatiquement.",
          frameTitle: "Reservation Calendly BrotherStudio",
        }
      : {
          eyebrow: "Book a meeting",
          title: "Book a Google Meet call.",
          text: "Choose an available time slot. The meeting is added to the calendar with the Google Meet link created automatically.",
          frameTitle: "BrotherStudio Calendly booking",
        };

  return (
    <main className="siteMain">
      <section className="contactPageStack">
        <ScrollReveal as="section" className="contactLayout" aria-labelledby="contactTitle">
          <div className="contactBlock contactBlockDetails">
            <h1 id="contactTitle" className="contactTitle contactAccent">
              {messages.contact.title}
            </h1>
            <p className="contactIntro">
              {bookingCopy.text}
            </p>
            <address className="contactText contactAccent">
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
          </div>

          <div className="contactBlock">
            <p className="bookingEyebrow">{bookingCopy.eyebrow}</p>
            <h2 className="bookingTitle">{bookingCopy.title}</h2>
            <CalendlyEmbed title={bookingCopy.frameTitle} url={CALENDLY_MEETING_URL} />
          </div>
        </ScrollReveal>

        <ScrollReveal as="section" className="contactBlock" aria-labelledby="contactFormTitle">
          <h2 id="contactFormTitle" className="contactTitle contactAccent">
            {messages.contact.detailsTitle}
          </h2>
          <ContactForm messages={messages.contact.form} />
        </ScrollReveal>
      </section>
    </main>
  );
}
