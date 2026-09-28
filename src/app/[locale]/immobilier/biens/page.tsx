import type { Metadata } from "next";

import { RealEstateListings } from "@/components/RealEstateListings";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";
import { toAbsoluteUrl } from "@/lib/siteUrl";

type RealEstateListingsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: RealEstateListingsPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/immobilier/biens";
  const title = locale === "fr" ? "Biens immobiliers à vendre en Suisse romande" : "Properties for sale in French-speaking Switzerland";
  const description = locale === "fr" ? "Parcourez notre sélection d’appartements, maisons, villas, terrains et projets neufs à vendre en Suisse romande." : "Browse our selection of apartments, houses, villas, land and new developments for sale in French-speaking Switzerland.";
  return {
    title,
    description,
    keywords: locale === "fr" ? ["biens immobiliers à vendre", "appartement à vendre Suisse", "maison à vendre Valais", "projet neuf Suisse romande"] : ["properties for sale", "apartments Switzerland", "houses Valais", "new developments Switzerland"],
    robots: { index: true, follow: true },
    alternates: { canonical: withLocalePath(locale, pathname), languages: getLanguageAlternates(pathname) },
    openGraph: { title, description, url: withLocalePath(locale, pathname), type: "website", images: [{ url: toAbsoluteUrl("/immobilier/monthey/vue-1.webp"), alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [toAbsoluteUrl("/immobilier/monthey/vue-1.webp")] },
  };
}

export default async function RealEstateListingsPage({ params }: RealEstateListingsPageProps) {
  const locale = await resolveLocaleParam(params);
  return <RealEstateListings locale={locale} />;
}
