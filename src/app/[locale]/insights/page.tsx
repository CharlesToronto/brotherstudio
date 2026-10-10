import type { Metadata } from "next";

import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";
import InsightsClient from "@/components/InsightsClient";

type InsightsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: InsightsPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/insights";
  const title = locale === "fr"
    ? "Insights | BrotherStudio — Marketing immobilier, CGI et vente"
    : "Insights | BrotherStudio — Property marketing, CGI and real estate";
  const description = locale === "fr"
    ? "Des conseils pratiques sur le marketing immobilier, la visualisation architecturale, la vidéo, les sites web et la génération de prospects."
    : "Practical insights on real estate marketing, architectural CGI, video, websites and qualified lead generation.";

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
      type: "website",
      url: withLocalePath(locale, pathname),
      images: ["/myexperience-hero-night.webp"],
    },
  };
}

export default async function InsightsPage({ params }: InsightsPageProps) {
  const locale = await resolveLocaleParam(params);
  return <InsightsClient locale={locale} />;
}
