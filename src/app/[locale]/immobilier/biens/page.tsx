import type { Metadata } from "next";

import { RealEstateListings } from "@/components/RealEstateListings";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type RealEstateListingsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: RealEstateListingsPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/immobilier/biens";
  const title = locale === "fr" ? "Nos biens immobiliers" : "Our properties";
  const description = locale === "fr" ? "Découvrez notre sélection de biens immobiliers en Suisse romande." : "Discover our selection of properties in French-speaking Switzerland.";
  return { title, description, alternates: { canonical: withLocalePath(locale, pathname), languages: getLanguageAlternates(pathname) } };
}

export default async function RealEstateListingsPage({ params }: RealEstateListingsPageProps) {
  const locale = await resolveLocaleParam(params);
  return <RealEstateListings locale={locale} />;
}
