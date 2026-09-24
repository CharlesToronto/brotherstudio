import type { Metadata } from "next";

import { RealEstateCommercialStudio } from "@/components/RealEstateCommercialStudio";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type CommercialisationPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: CommercialisationPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/immobilier/commercialisation";
  const title = locale === "fr" ? "Studio de commercialisation" : "Marketing studio";
  const description = locale === "fr" ? "Positionnement, images, site web et supports pour commercialiser votre promotion immobilière." : "Positioning, imagery, websites and sales materials for your real estate development.";
  return { title, description, alternates: { canonical: withLocalePath(locale, pathname), languages: getLanguageAlternates(pathname) } };
}

export default async function CommercialisationPage({ params }: CommercialisationPageProps) {
  const locale = await resolveLocaleParam(params);
  return <RealEstateCommercialStudio locale={locale} />;
}
