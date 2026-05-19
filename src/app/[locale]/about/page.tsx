import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { AboutBiography } from "@/components/AboutBiography";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getMessages } from "@/content/messages";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleAboutPageProps = {
  params: Promise<{ locale: string }>;
};

const ABOUT_PORTRAIT_SRC = "/about-portrait-charles-2026.webp";

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
        <ScrollReveal as="section" className="aboutPortraitSection" aria-labelledby="aboutTitle">
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
        </ScrollReveal>

        <section className="aboutContent">
          <ScrollReveal as="div">
            <p className="aboutEyebrow contactAccent">{messages.about.location}</p>
            <h1 id="aboutTitle" className="aboutTitle">
              {messages.about.title}
            </h1>
          </ScrollReveal>

          <ScrollReveal
            as="section"
            className="aboutSection aboutSectionFirst"
            aria-labelledby="aboutBiographyTitle"
            delay={40}
          >
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
          </ScrollReveal>

          <ScrollReveal
            as="section"
            className="aboutSection"
            aria-labelledby="aboutHighlightsTitle"
            delay={80}
          >
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
          </ScrollReveal>

          <ScrollReveal
            as="section"
            className="aboutSection"
            aria-labelledby="aboutContactTitle"
            delay={120}
          >
            <h2 id="aboutContactTitle" className="aboutSectionTitle">
              <Link href={withLocalePath(locale, "/contact")}>
                {messages.about.ctaLinkLabel}
              </Link>
            </h2>
          </ScrollReveal>
        </section>
      </div>
    </main>
  );
}
