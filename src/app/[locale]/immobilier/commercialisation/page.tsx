import type { Metadata } from "next";

import { RealEstateCommercialStudio } from "@/components/RealEstateCommercialStudio";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";
import { toAbsoluteUrl } from "@/lib/siteUrl";

type CommercialisationPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: CommercialisationPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/immobilier/commercialisation";
  const title = locale === "fr" ? "Commercialisation immobilière pour promoteurs" : "Real estate marketing for developers";
  const description = locale === "fr" ? "Positionnement, images 3D, site web et supports commerciaux pour vendre votre promotion immobilière, de l’idée à la vente." : "Positioning, CGI, websites and sales materials to market and sell your real estate development, from idea to sale.";
  return {
    title,
    description,
    keywords: locale === "fr" ? ["commercialisation immobilière", "marketing immobilier", "promoteur immobilier Suisse", "images 3D immobilier"] : ["real estate marketing", "property marketing Switzerland", "developer marketing", "real estate CGI"],
    robots: { index: true, follow: true },
    alternates: { canonical: withLocalePath(locale, pathname), languages: getLanguageAlternates(pathname) },
    openGraph: { title, description, url: withLocalePath(locale, pathname), type: "website", images: [{ url: toAbsoluteUrl("/immobilier/hero-promotion.webp"), alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [toAbsoluteUrl("/immobilier/hero-promotion.webp")] },
  };
}

export default async function CommercialisationPage({ params }: CommercialisationPageProps) {
  const locale = await resolveLocaleParam(params);
  return <RealEstateCommercialStudio locale={locale} />;
}
