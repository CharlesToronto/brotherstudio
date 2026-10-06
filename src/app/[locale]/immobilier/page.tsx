import type { Metadata } from "next";

import { RealEstateCommercialHome } from "@/components/RealEstateCommercialHome";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";
import { toAbsoluteUrl } from "@/lib/siteUrl";

type RealEstatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: RealEstatePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/immobilier";
  const title = locale === "fr" ? "Immobilier en Suisse romande" : "Real estate in French-speaking Switzerland";
  const description =
    locale === "fr"
      ? "Découvrez des biens immobiliers en Suisse romande et présentez votre projet avec Brother Studio, de l’idée à la vente."
      : "Discover properties in French-speaking Switzerland and market your development with Brother Studio, from idea to sale.";

  return {
    title,
    description,
    keywords: locale === "fr"
      ? ["immobilier Suisse romande", "biens immobiliers à vendre", "promotion immobilière", "commercialisation immobilière"]
      : ["real estate French-speaking Switzerland", "properties for sale", "real estate development", "property marketing"],
    robots: { index: true, follow: true },
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title,
      description,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CH" : "en_CH",
      type: "website",
      images: [{ url: toAbsoluteUrl("/immobilier/hero-lac-alpes.webp"), width: 2400, height: 1669, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [toAbsoluteUrl("/immobilier/hero-lac-alpes.webp")] },
  };
}

export default async function RealEstatePage({ params }: RealEstatePageProps) {
  const locale = await resolveLocaleParam(params);
  const pageUrl = toAbsoluteUrl(withLocalePath(locale, "/immobilier"));
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateAgent",
        name: "Brother Studio Immobilier",
        url: pageUrl,
        image: toAbsoluteUrl("/immobilier/hero-lac-alpes.webp"),
        areaServed: { "@type": "Place", name: "Suisse romande" },
        email: "info@brotherstudio.ca",
        telephone: "+1 437 677 3212",
      },
      {
        "@type": "WebSite",
        name: "Brother Studio Immobilier",
        url: pageUrl,
        inLanguage: locale,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <RealEstateCommercialHome locale={locale} />
    </>
  );
}
