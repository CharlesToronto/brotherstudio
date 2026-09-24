import type { Metadata } from "next";

import { RealEstateCommercialHome } from "@/components/RealEstateCommercialHome";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type RealEstatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: RealEstatePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/immobilier";
  const title = locale === "fr" ? "Promotion immobilière — Brother Studio" : "Real estate development — Brother Studio";
  const description =
    locale === "fr"
      ? "Nous accompagnons la commercialisation de promotions immobilières, de l’image à la vente."
      : "We support the marketing of real estate developments, from image to sale.";

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
  return <RealEstateCommercialHome locale={locale} />;
}
