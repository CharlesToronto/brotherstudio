import { cookies } from "next/headers";
import { ANALYTICS_EXCLUSION_COOKIE } from "@/lib/analyticsPreference";
import type { Metadata } from "next";

import { CampaignLandingPage } from "@/components/CampaignLandingPage";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/immobilier/vendre";
  const title =
    locale === "fr"
      ? "Estimation gratuite de vos biens"
      : "Free valuation of your property";
  const description =
    locale === "fr"
      ? "Estimation gratuite et accompagnement immobilier, de la mise en valeur de votre bien à sa vente."
      : "Free property valuation and support, from presenting your property to completing the sale.";

  return {
    title,
    description,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
  };
}

export default async function LandingPage({ params }: LandingPageProps) {
  const locale = await resolveLocaleParam(params);
  const analyticsEnabled = process.env.NODE_ENV === "production" && process.env.VERCEL === "1" && (await cookies()).get(ANALYTICS_EXCLUSION_COOKIE)?.value !== "1";
  return <CampaignLandingPage analyticsEnabled={analyticsEnabled} locale={locale} heroVideoSrc="/videos/landing-estimation.mp4" />;
}
