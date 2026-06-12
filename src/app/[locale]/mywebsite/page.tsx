import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { getLanguageAlternates, type Locale, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

type WebsitePreview = {
  title: string;
  href?: string;
  image: string;
  alt: string;
};

function getWebsitePreviews(locale: Locale): WebsitePreview[] {
  const href = withLocalePath(locale, "/myexperience");

  return [
    {
      title: "Mesange",
      href,
      image: "/myexperience-hero-night.webp",
      alt:
        locale === "fr"
          ? "Apercu du site de vente Mesange avec facade au crepuscule"
          : "Preview of the Mesange sales website with dusk exterior view",
    },
    {
      title: "Maretset (coming soon)",
      image: "/mywebsite-maretset-cover.png",
      alt:
        locale === "fr"
          ? "Apercu du site de vente Maretset"
          : "Preview of the Maretset sales website",
    },
    {
      title: "Coming soon",
      image: "/mywebsite-coming-soon-cover.png",
      alt:
        locale === "fr"
          ? "Apercu d un prochain site de vente"
          : "Preview of an upcoming sales website",
    },
  ];
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/mywebsite";
  const title = "Mywebsite";
  const description =
    locale === "fr"
      ? "Selection minimaliste des sites de vente signes BrotherStudio."
      : "Minimal selection of sales websites crafted by BrotherStudio.";

  return {
    title,
    description,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title,
      description,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function MyWebsitePage({ params }: LocalePageProps) {
  const locale = await resolveLocaleParam(params);
  const previews = getWebsitePreviews(locale);

  return (
    <main className="siteMain myWebsitePage">
      <section className="myWebsiteShell">
        <header className="myWebsiteHeader">
          <h1 className="myWebsiteTitle">Mywebsite</h1>
        </header>

        <section
          className="myWebsiteGrid"
          aria-label={locale === "fr" ? "Apercus des sites" : "Website previews"}
        >
          {previews.map((preview, index) => (
            <article
              key={`${preview.title}-${index}`}
              className={`myWebsiteCard${preview.href ? " myWebsiteCardLink" : ""}`}
            >
              {preview.href ? (
                <Link className="myWebsiteCardInner" href={preview.href}>
                  <div className="myWebsiteCardMedia">
                    <Image
                      src={preview.image}
                      alt={preview.alt}
                      fill
                      sizes="(max-width: 900px) 100vw, 33vw"
                      className="myWebsiteCardImage"
                    />
                  </div>
                  <div className="myWebsiteCardFooter">
                    <span className="myWebsiteCardTitle">{preview.title}</span>
                  </div>
                </Link>
              ) : (
                <div className="myWebsiteCardInner" aria-label={preview.alt}>
                  <div className="myWebsiteCardMedia">
                    <Image
                      src={preview.image}
                      alt={preview.alt}
                      fill
                      sizes="(max-width: 900px) 100vw, 33vw"
                      className="myWebsiteCardImage"
                    />
                  </div>
                  <div className="myWebsiteCardFooter">
                    <span className="myWebsiteCardTitle">{preview.title}</span>
                  </div>
                </div>
              )}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
