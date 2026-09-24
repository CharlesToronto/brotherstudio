import type { Metadata } from "next";

import { RealEstateProjectProfile } from "@/components/RealEstateProjectProfile";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type ProjectPageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { locale, projectId } = await params.then(async ({ locale: rawLocale, projectId: rawProjectId }) => ({
    locale: await resolveLocaleParam(Promise.resolve({ locale: rawLocale })),
    projectId: rawProjectId,
  }));
  const title = locale === "fr" ? "Profil du projet immobilier" : "Real estate project profile";
  const pathname = `/immobilier/${projectId}`;

  return {
    title,
    description: locale === "fr" ? "Découvrez les détails de ce projet immobilier." : "Discover the details of this real estate project.",
    alternates: { canonical: withLocalePath(locale, pathname), languages: getLanguageAlternates(pathname) },
  };
}

export default async function RealEstateProjectPage({ params }: ProjectPageProps) {
  const { locale, projectId } = await params;
  const resolvedLocale = await resolveLocaleParam(Promise.resolve({ locale }));
  return <RealEstateProjectProfile locale={resolvedLocale} projectId={projectId} />;
}
