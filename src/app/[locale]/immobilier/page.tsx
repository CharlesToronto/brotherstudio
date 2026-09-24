import type { Metadata } from "next";

import { RealEstateListings } from "@/components/RealEstateListings";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type RealEstatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: RealEstatePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/immobilier";
  const title = locale === "fr" ? "Immobilier — Des lieux à vivre" : "Real estate — Places to live";
  const description =
    locale === "fr"
      ? "Découvrez une sélection de biens et de projets immobiliers en Suisse romande."
      : "Discover a selection of properties and real estate projects in French-speaking Switzerland.";

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
      locale: locale === "fr" ? "fr_CH" : "en_CH",
    },
  };
}

export default async function RealEstatePage({ params }: RealEstatePageProps) {
  const locale = await resolveLocaleParam(params);
  return <RealEstateListings locale={locale} />;
}
