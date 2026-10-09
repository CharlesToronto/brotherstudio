import type { Metadata } from "next";

import { MortgageCalculator } from "@/components/MortgageCalculator";
import { RealEstateFooter } from "@/components/RealEstateFooter";
import { RealEstateNavigation } from "@/components/RealEstateNavigation";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";
import { toAbsoluteUrl } from "@/lib/siteUrl";

type MortgageCalculatorPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ price?: string | string[]; property?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: MortgageCalculatorPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/immobilier/calculateur-hypothecaire";
  const title = locale === "fr" ? "Calculateur hypothécaire suisse" : "Swiss mortgage calculator";
  const description = locale === "fr" ? "Estimez votre capacité de financement pour un bien immobilier en Suisse." : "Estimate your financing capacity for a property in Switzerland.";
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: withLocalePath(locale, pathname), languages: getLanguageAlternates(pathname) },
    openGraph: { title, description, url: withLocalePath(locale, pathname), type: "website", images: [{ url: toAbsoluteUrl("/immobilier/hero-lac-alpes.webp"), alt: title }] },
  };
}

export default async function MortgageCalculatorPage({ params, searchParams }: MortgageCalculatorPageProps) {
  const locale = await resolveLocaleParam(params);
  const query = await searchParams;
  const price = Number(firstParam(query.price));
  const initialPrice = Number.isFinite(price) && price > 0 ? Math.round(price) : undefined;
  const propertyLabel = firstParam(query.property)?.slice(0, 160);
  return <>
    <RealEstateNavigation locale={locale} />
    <MortgageCalculator locale={locale} initialPrice={initialPrice} propertyLabel={propertyLabel} />
    <RealEstateFooter locale={locale} />
  </>;
}
