import Image from "next/image";
import type { Metadata } from "next";

import { AboutBiography } from "@/components/AboutBiography";
import { getMessages } from "@/content/messages";
import { site } from "@/content/site";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleAboutPageProps = {
  params: Promise<{ locale: string }>;
};

const ABOUT_PORTRAIT_SRC = "/about-portrait-charles.png";

export async function generateMetadata({
  params,
}: LocaleAboutPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const pathname = "/about";

  return {
    title: messages.about.title,
    description: messages.about.metadataDescription,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title: messages.about.title,
      description: messages.about.metadataDescription,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
    twitter: {
      title: messages.about.title,
      description: messages.about.metadataDescription,
    },
  };
}

export default async function LocalizedAboutPage({
  params,
}: LocaleAboutPageProps) {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);

  return (
    <main className="siteMain">
      <div className="aboutLayout">
        <section className="aboutPortraitSection" aria-labelledby="aboutTitle">
          <div className="aboutPortraitFrame">
            <Image
              src={ABOUT_PORTRAIT_SRC}
              alt={messages.about.portraitAlt}
              fill
              priority
              sizes="(max-width: 780px) calc(100vw - 36px), 360px"
              className="aboutPortrait"
            />
          </div>
          <p className="aboutPortraitCaption">{messages.about.portraitCaption}</p>
        </section>

        <section className="aboutContent">
          <p className="aboutEyebrow contactAccent">{messages.about.location}</p>
          <h1 id="aboutTitle" className="aboutTitle">
            {messages.about.title}
          </h1>

          <section className="aboutSection aboutSectionFirst" aria-labelledby="aboutBiographyTitle">
            <h2
              id="aboutBiographyTitle"
              className="aboutSectionTitle contactAccent"
            >
              {messages.about.biographyTitle}
            </h2>
            <AboutBiography
              intro={messages.about.intro}
              paragraphs={messages.about.paragraphs}
              buttons={messages.about.biographyButtons}
            />
          </section>

          <section className="aboutSection" aria-labelledby="aboutHighlightsTitle">
            <h2
              id="aboutHighlightsTitle"
              className="aboutSectionTitle contactAccent"
            >
              {messages.about.highlightsTitle}
            </h2>
            <ul
              className="aboutList"
              aria-label={`${messages.about.highlightsTitle} list`}
            >
              {messages.about.highlights.map((item) => (
                <li key={item} className="aboutItem">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="aboutSection" aria-labelledby="aboutConnectTitle">
            <h2 id="aboutConnectTitle" className="aboutSectionTitle">
              {messages.about.connectTitle}
            </h2>
            <p className="aboutParagraph">{messages.about.connectText}</p>
            <div className="aboutLinkRow">
              <a className="aboutLink" href={`mailto:${site.contact.email}`}>
                {messages.about.emailLabel}: {site.contact.email}
              </a>
              <a
                className="aboutLink"
                href={site.instagramUrl}
                target="_blank"
                rel="noreferrer"
              >
                {messages.about.instagramLabel}
              </a>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
